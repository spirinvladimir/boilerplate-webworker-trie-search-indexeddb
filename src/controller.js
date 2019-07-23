/*global view edit input_search checkbox_view protocol STORAGE_NAME caption*/
const
    domready = require('domready'),
    countries = {
        //model: require('./model/countries'),//was moved to WebWorker
        view: require('./view/countries')
    },
    customer = {
        model: require('./model/customer'),
        view: require('./view/customer').view
    },
    validation = require('./validation'),
    CUSTOMER = require('./view/customer').enum,
    NEW_CUSTOMER = require('./view/new_customer').enum,
    // Few enums for access to view children (one of other ways is create API to manage it inside view, but I desided to keep view as simple as possible)
    NAV = {
        VIEW: 0,
        EDIT: 1
    },
    // Notes for reviewers: Last lang I've learned was Elixir.
    // In Elixir is not allowed to use dinamic strings, so next listing a string constans
    // is a flavor of Elixir code style
    DOM = {
        CLASS: {
            CUSTOMER: 'customer',
            REMOVE: 'remove',
            EDIT: 'edit',
            REVERT: 'revert',
            CONFIRM: 'confirm',
            ACTIVE: 'active',
            DISABLE: 'disable',
            HIDE: 'hide'
        },
        ID: {
            COUNTRIES: 'countries',
            NAV_VIEW: 'nav_view',
            NAV_EDIT: 'nav_edit',
            SUBMIT: 'submit'
        }
    }

protocol.set_worker(new Worker('src/worker.js', {name: STORAGE_NAME}))

Promise.all([// here is startup speedup:
    new Promise(protocol.on_load),// 1st CPU load state from IndexedDB
    new Promise(domready) // 2nd CPU load DOM
]).then(([state]) => {
    // Show all customers form cached state
    state.customers
        .map(customer.view)
        .reduce(
            (container, customer_view) => {
                container.appendChild(customer_view)
                return container
            },
            view
        )
    countries.view(document.getElementById(DOM.ID.COUNTRIES))(state.countries)

    //Setup validation fields for adding new customer
    validation(edit, NEW_CUSTOMER, state.customers).enable()

    input_search.onkeyup = event => {
        const request = event.target.value.trim()

        request.length === 0
            ? state.customers.forEach((_, id) => view.children[id].classList.remove(DOM.CLASS.HIDE))
            : protocol.search_request(request)
    }

    protocol.on_search_response(show_customers_ids =>
        state.customers.forEach((_, id) => view.children[id].classList.toggle(DOM.CLASS.HIDE, !show_customers_ids.includes(String(id))))
    )

    // Activate last view from previous session
    switch (state.nav) {
        case NAV.VIEW:
            activate_view()
            break
        case NAV.EDIT:
            activate_edit()
            break
        default:
    }

    checkbox_view.onchange = () => checkbox_view.checked ? activate_edit() : activate_view()

    // Single interaction click controller for cover all buisness logic in one place
    document.body.onclick = event => {
        switch (event.target.id) {
            case DOM.ID.SUBMIT:
                add_new_customer()
                break
            default:// Hadle user click in customer card:
                if (!event.target.parentElement.classList.contains(DOM.CLASS.CUSTOMER)) return
                const
                    id = Array.prototype.findIndex.call(view.children, _ => _ === event.target.parentElement),
                    customer = state.customers[id],
                    customer_element = view.children[id],
                    children = customer_element.children,
                    customer_validation = validation(customer_element, CUSTOMER, state.customers.filter(_ => _ !== customer))
                if (event.target.classList.contains(DOM.CLASS.REMOVE)) {
                    view.removeChild(event.target.parentElement)
                    state.customers.splice(id, 1)
                    protocol.delete_customer(id)
                } else if (event.target.classList.contains(DOM.CLASS.EDIT) ) {
                    if (customer_element.classList.contains(DOM.CLASS.EDIT)) {
                        customer_element.classList.remove(DOM.CLASS.EDIT)
                        customer_validation.disable()
                    } else {
                        countries.view(customer_element.children[CUSTOMER.SELECT_COUNTRY])(state.countries)
                        customer_element.children[CUSTOMER.SELECT_COUNTRY].value = customer.country
                        customer_element.classList.add(DOM.CLASS.EDIT)
                        customer_validation.enable()
                    }
                } else if (event.target.classList.contains(DOM.CLASS.REVERT)) {
                    children[CUSTOMER.INPUT_FIRST_NAME].value = children[CUSTOMER.FIRST_NAME].textContent
                    children[CUSTOMER.INPUT_LAST_NAME].value = children[CUSTOMER.LAST_NAME].textContent
                    children[CUSTOMER.INPUT_EMAIL].value = children[CUSTOMER.EMAIL].textContent
                    Array.prototype.find.call(children[CUSTOMER.SELECT_COUNTRY].children, _ => _.textContent === children[CUSTOMER.COUNTRY].textContent).selected = true
                    customer_validation.remove_errors()
                } else if (event.target.classList.contains(DOM.CLASS.CONFIRM) && !event.target.classList.contains(DOM.CLASS.DISABLE)) {
                    children[CUSTOMER.FIRST_NAME].textContent = children[CUSTOMER.INPUT_FIRST_NAME].value
                    children[CUSTOMER.LAST_NAME].textContent = children[CUSTOMER.INPUT_LAST_NAME].value
                    customer.email = children[CUSTOMER.EMAIL].textContent = children[CUSTOMER.INPUT_EMAIL].value
                    children[CUSTOMER.COUNTRY].textContent = Array.prototype.find.call(children[CUSTOMER.SELECT_COUNTRY].children, _ => _.value === children[CUSTOMER.SELECT_COUNTRY].value).textContent
                    customer.country = children[CUSTOMER.SELECT_COUNTRY].value
                    customer_element.classList.remove(DOM.CLASS.EDIT)
                    customer_validation.disable()
                    // Update state in DB only in case of changes
                    const changed = Boolean(
                        children[CUSTOMER.FIRST_NAME].textContent !== customer.first_name ||
                        children[CUSTOMER.LAST_NAME].textContent !== customer.last_name ||
                        children[CUSTOMER.EMAIL].textContent !== customer.email ||
                        children[CUSTOMER.SELECT_COUNTRY].value !== customer.country
                    )

                    if (changed)
                        protocol.update_customer({
                            id,
                            customer: {
                                first_name: children[CUSTOMER.FIRST_NAME].textContent,
                                last_name: children[CUSTOMER.LAST_NAME].textContent,
                                email: children[CUSTOMER.EMAIL].textContent,
                                country: children[CUSTOMER.SELECT_COUNTRY].value
                            }
                        })
                }
        }
    }

    function activate_view () {
        checkbox_view.checked = false
        view.classList.remove(DOM.CLASS.EDIT)
        edit.classList.remove(DOM.CLASS.ACTIVE)
        caption.classList.remove(DOM.CLASS.HIDE)
        if (state.nav === NAV.EDIT) {
            state.nav = NAV.VIEW
            protocol.activate_view()
        }
    }

    function activate_edit () {
        checkbox_view.checked = true
        view.classList.add(DOM.CLASS.EDIT)
        edit.classList.add(DOM.CLASS.ACTIVE)
        caption.classList.add(DOM.CLASS.HIDE)
        if (state.nav === NAV.VIEW) {
            state.nav = NAV.EDIT
            protocol.activate_edit()
        }
    }

    function add_new_customer () {
        const
            model = customer.model(),
            id = state.customers.push(model) - 1

        view.appendChild(customer.view(model))
        protocol.create_customer({id, customer: model})
    }
})
