/*global importScripts protocol localforage delete_doc create_doc insert_doc autosubmit create_trie*/
importScripts('localforage.min.js')
importScripts('protocol.js')
importScripts('search.js')
console.log(self.name)
const
    DB_KEY = {
        STATE: self.name
    },
    NAV = {
        VIEW: 0,
        EDIT: 1
    },
    set_defaults_to_state = state => {
        state.nav = 1
        state.customers = [],
        state.trie = create_trie()
        return state
    },
    COUNTRIES_PUBLIC_LINK = 'https://restcountries.eu/rest/v2/all',
    save = state => localforage.setItem(DB_KEY.STATE, JSON.stringify(state)),
    load = () => localforage.getItem(DB_KEY.STATE).then(_ => JSON.parse(_)),
    customer2search_payload = customer => [
        customer.first_name,
        customer.last_name,
        customer.country
    ].join(' ')

localforage.ready(() =>
    localforage.getItem(DB_KEY.STATE)
        .then(raw_state =>
            raw_state
                ? JSON.parse(raw_state)
                : fetch(COUNTRIES_PUBLIC_LINK)
                        .then(r => r.ok ? r.json() : Promise.reject(new Error('can not load countries list from public API')))
                        .then(countries => countries.map(country => country.name))
                        .then(countries => {
                            const
                                state = set_defaults_to_state({countries})

                            state.countries = countries
                            return save(state).then(() => state)
                        })
        )
        .then(state =>//state at worker side is larger then state at main thread
            Object({
                //trie: state.trie, // search index is stored only at WebWorker side
                nav: state.nav,
                countries: state.countries,
                customers: state.customers
            })
        )
        .then(protocol.load)
)

onmessage = protocol
    .on_create_customer(({id, customer}) => {
        load().then(state => {
            state.customers[id] = customer
            insert_doc(state.trie, create_doc(customer.email, customer2search_payload(customer), id))
            save(state)
        })
    })
    .on_update_customer(({id, customer}) => {
        load().then(state => {
            // delete whole customer form search index
            delete_doc(state.trie, create_doc(state.customers[id].email, customer2search_payload(state.customers[id]), id))
            // update customer with new data
            state.customers[id].first_name = customer.first_name
            state.customers[id].last_name = customer.last_name
            state.customers[id].email = customer.email
            state.customers[id].country = customer.country
            // insert whole customer with updated data to search index
            insert_doc(state.trie, create_doc(customer.email, customer2search_payload(customer), id))
            save(state)
        })
    })
    .on_delete_customer(id => {
        load().then(state => {
            const customer = state.customers[id]
            state.customers.splice(id, 1)
            delete_doc(state.trie, create_doc(customer.email, customer2search_payload(customer), id))
            save(state)
        })
    })
    .on_activate_view(() => {
        load().then(state => {
            state.nav = NAV.VIEW
            save(state)
        })
    })
    .on_activate_edit(() => {
        load().then(state => {
            state.nav = NAV.EDIT
            save(state)
        })
    })
    .on_search_request(request => {
        load().then(state => {
            protocol.search_response(autosubmit(state.trie, request))
        })
    })
    .onmessage
