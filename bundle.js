(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
!function (name, definition) {

  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()

}('domready', function () {

  var fns = [], listener
    , doc = document
    , hack = doc.documentElement.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState)


  if (!loaded)
  doc.addEventListener(domContentLoaded, listener = function () {
    doc.removeEventListener(domContentLoaded, listener)
    loaded = 1
    while (listener = fns.shift()) listener()
  })

  return function (fn) {
    loaded ? setTimeout(fn, 0) : fns.push(fn)
  }

});

},{}],2:[function(require,module,exports){
module.exports = {
    validation: {
        first_name: {
            min: 10,
            max: 20
        },
        last_name: {
            min: 10,
            max: 20
        }
    }
}

},{}],3:[function(require,module,exports){
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

},{"./model/customer":4,"./validation":5,"./view/countries":6,"./view/customer":7,"./view/new_customer":8,"domready":1}],4:[function(require,module,exports){
module.exports = () => {
    const
        customer = {},
        element = {
            first_name: document.getElementById('first-name'),
            last_name: document.getElementById('last-name'),
            email: document.getElementById('email'),
            countries: document.getElementById('countries'),
            submit: document.getElementById('submit')
        }
    customer.first_name = element.first_name.value
    customer.last_name = element.last_name.value
    customer.email = element.email.value
    customer.country = element.countries.value

    element.first_name.value = ''
    element.last_name.value = ''
    element.email.value = ''
    element.countries.value = 'null'
    element.submit.classList.add('disable')

    return customer
}

},{}],5:[function(require,module,exports){
const
    rule = require('./config').validation

// Custom validation was selected because form action field won't be used to send form-data anywhere
// For not create work around in form action field I'm using enable/disable confirm button logic.

// It could be huge amount of customer in view.
// From memory usage perspective it is better to keep validation handlers only at editable customers.
// This for enable/disable switch was implemented.
module.exports = (element, customer_enum, customers) => {
    const
        input_first_name = element.children[customer_enum.INPUT_FIRST_NAME],
        input_last_name = element.children[customer_enum.INPUT_LAST_NAME],
        input_email = element.children[customer_enum.INPUT_EMAIL],
        select_country = element.children[customer_enum.SELECT_COUNTRY],
        confirm = element.children[customer_enum.CONFIRM],
        error_msg = element.children[customer_enum.ERROR]

    input_first_name.setAttribute('msg', [rule.first_name.min, '< first name length <', rule.first_name.max].join(' '))
    input_last_name.setAttribute('msg', [rule.last_name.min, '< last name length <', rule.last_name.max].join(' '))
    input_email.setAttribute('msg', 'incorrect or existed email')
    select_country.setAttribute('msg', 'select country')

    function recalculate_form_error_state(target, error) {
        let
            other_error
        target && target.classList.toggle('error', error)
        error_msg.classList.toggle('active', error)
        other_error = element.querySelector('.error')
        confirm.classList.toggle('disable', other_error !== null)
        if (error) {
            error_msg.classList.add('active')
            error_msg.textContent = target.getAttribute('msg')
        } else if (other_error === null) {
            error_msg.textContent = ''
            error_msg.classList.remove('active')
        } else {
            error_msg.textContent = other_error.getAttribute('msg')
            error_msg.classList.add('active')
        }
    }
    recalculate_form_error_state(null, false)
    // I do not .addEventListener here for estrict amount on listeners with exactly 1 listener
    // This estricment simplify to finding consumer of event and as side effect avoid mem leak.
    return {
        enable: () => {
            input_first_name.onkeyup = input_first_name.onblur = event => {
                const
                    value = event.target.value,
                    error = value.length < rule.first_name.min || value.length > rule.first_name.max
                recalculate_form_error_state(event.target, error)
            }
            input_last_name.onkeyup = input_last_name.onblur = event => {
                const
                    value = event.target.value,
                    error = value.length < rule.last_name.min || value.length > rule.last_name.max
                recalculate_form_error_state(event.target, error)
            }
            input_email.onkeyup = input_email.onblur = event => {
                const
                    value = event.target.value,
                    // For email validation I've took best solution from:
                    // https://stackoverflow.com/a/46181
                    // eslint-disable-next-line
                    error_format = !/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(String(value).toLowerCase()),
                    error = error_format || Boolean(customers.find(_ => _.email === value))
                recalculate_form_error_state(event.target, error)
            }
            select_country.onchange = event => {
                const
                    value = event.target.value,
                    error = value === 'null'//might be better way...
                recalculate_form_error_state(event.target, error)
            }
        },
        disable: () => {
            input_first_name.onblur = null
            input_last_name.onblur = null
            input_email.onblur = null
            select_country.onchange = null
        },
        remove_errors: () => {
            Array.prototype.forEach.call(element.querySelectorAll('.error'), _ => _.classList.remove('error'))
            recalculate_form_error_state(null, false)
        }
    }
}

},{"./config":2}],6:[function(require,module,exports){
const fill_selector_once = _ => _.children.length <= 1// to reviewer: sometimes better add function with name instead adding comments

module.exports = element => countries =>
    fill_selector_once(element) && countries.reduce(
        (selector, country) => {
            var element = document.createElement('option')
            element.value = country
            element.textContent = country
            selector.appendChild(element)
            return selector
        },
        element)

},{}],7:[function(require,module,exports){
module.exports.enum = {
    FIRST_NAME: 0,
    INPUT_FIRST_NAME: 1,
    LAST_NAME: 2,
    INPUT_LAST_NAME: 3,
    EMAIL: 4,
    INPUT_EMAIL: 5,
    COUNTRY: 6,
    SELECT_COUNTRY: 7,
    REMOVE: 8,
    EDIT: 9,
    CONFIRM: 10,
    REVERT: 11,
    FACE: 12,
    ERROR: 13
}
module.exports.view = customer => {
    const
        elements = {
            customer: document.createElement('div'),
            first_name: document.createElement('div'),
            input_first_name: document.createElement('input'),
            last_name: document.createElement('div'),
            input_last_name: document.createElement('input'),
            email: document.createElement('div'),
            input_email: document.createElement('input'),
            country: document.createElement('div'),
            select_country: document.createElement('select'),
            remove: document.createElement('i'),
            edit: document.createElement('i'),
            confirm: document.createElement('i'),
            revert: document.createElement('i'),
            face: document.createElement('i'),
            error: document.createElement('div')
        },
        inputs = [elements.input_first_name, elements.input_last_name, elements.input_email],
        set_input_type = (type, _) => _.type = type

    inputs.reduce(set_input_type, 'text')

    elements.customer.classList.add('customer')
    elements.first_name.classList.add('first-name')
    elements.input_first_name.classList.add('input-first-name')
    elements.last_name.classList.add('last-name')
    elements.input_last_name.classList.add('input-last-name')
    elements.email.classList.add('email')
    elements.input_email.classList.add('input-email')
    elements.country.classList.add('country')
    elements.select_country.classList.add('select-country');
    elements.error.classList.add('error-msg');

    elements.remove.classList.add('material-icons')
    elements.remove.classList.add('md-24')
    elements.remove.classList.add('remove')
    elements.edit.classList.add('material-icons')
    elements.edit.classList.add('md-24')
    elements.edit.classList.add('edit')
    elements.confirm.classList.add('material-icons')
    elements.confirm.classList.add('md-24')
    elements.confirm.classList.add('confirm')
    elements.revert.classList.add('material-icons')
    elements.revert.classList.add('md-24')
    elements.revert.classList.add('revert')
    elements.face.classList.add('material-icons')
    elements.face.classList.add('md-24')
    elements.face.classList.add('face')

    elements.first_name.textContent = customer.first_name
    elements.input_first_name.placeholder = 'first name'
    elements.input_first_name.value = customer.first_name
    elements.last_name.textContent = customer.last_name
    elements.input_last_name.placeholder = 'last name'
    elements.input_last_name.value = customer.last_name
    elements.email.textContent = customer.email
    elements.input_email.placeholder = 'email'
    elements.input_email.value = customer.email
    elements.country.textContent = customer.country
    elements.remove.textContent = 'delete_forever'
    elements.edit.textContent = 'edit'
    elements.confirm.textContent = 'check_circle'
    elements.revert.textContent = 'restore'
    elements.face.textContent = 'face'

    elements.customer.appendChild(elements.first_name)
    elements.customer.appendChild(elements.input_first_name)
    elements.customer.appendChild(elements.last_name)
    elements.customer.appendChild(elements.input_last_name)
    elements.customer.appendChild(elements.email)
    elements.customer.appendChild(elements.input_email)
    elements.customer.appendChild(elements.country)
    elements.customer.appendChild(elements.select_country)
    elements.customer.appendChild(elements.confirm)
    elements.customer.appendChild(elements.revert)
    elements.customer.appendChild(elements.edit)
    elements.customer.appendChild(elements.remove)
    elements.customer.appendChild(elements.face)
    elements.customer.appendChild(elements.error)

    return elements.customer
}

},{}],8:[function(require,module,exports){
module.exports.enum = {
    INPUT_FIRST_NAME: 0,
    INPUT_LAST_NAME: 1,
    INPUT_EMAIL: 2,
    SELECT_COUNTRY: 3,
    CONFIRM: 4,
    ERROR: 5
}

},{}]},{},[3]);
