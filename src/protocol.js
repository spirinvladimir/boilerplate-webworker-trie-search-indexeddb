/*global protocol*/
const
    encode = _ => JSON.stringify(_),
    decode = _ => JSON.parse(_),
    API = {},
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LOAD = 'load',
    SEARCH_REQUEST = 'search_request',
    SEARCH_RESPONSE = 'search_response',
    ACTIVATE_VIEW = 'activate_view',
    ACTIVATE_EDIT = 'activate_edit'

let
    worker
//without var,let,const will be in global namespace for worker or main thread
// eslint-disable-next-line
protocol = {
    set_worker: _ => {
        worker = _
        worker.onmessage = protocol.onmessage
    },
    on_load: _ => {API.on_load = _;return protocol},
    on_create_customer: _ => {API.on_create_customer = _;return protocol},
    on_update_customer: _ => {API.on_update_customer = _;return protocol},
    on_delete_customer: _ => {API.on_delete_customer = _;return protocol},
    on_search_request: _ => {API.on_search_request = _;return protocol},
    on_search_response: _ => {API.on_search_response = _;return protocol},
    on_activate_view: _ => {API.on_activate_view = _;return protocol},
    on_activate_edit: _ => {API.on_activate_edit = _;return protocol},
    load: payload => postMessage(encode({type: LOAD, payload})),
    create_customer: payload => worker.postMessage(encode({type: CREATE, payload})),
    update_customer: payload => worker.postMessage(encode({type: UPDATE, payload})),
    delete_customer: payload => worker.postMessage(encode({type: DELETE, payload})),
    search_request: payload => worker.postMessage(encode({type: SEARCH_REQUEST, payload})),
    search_response: payload => postMessage(encode({type: SEARCH_RESPONSE, payload})),
    activate_view: payload => worker.postMessage(encode({type: ACTIVATE_VIEW, payload})),
    activate_edit: payload => worker.postMessage(encode({type: ACTIVATE_EDIT, payload})),
    onmessage: ({data}) => {
        const
            decoded = decode(data)
        switch (decoded.type) {
            case CREATE:
                API.on_create_customer(decoded.payload)
                break;
            case UPDATE:
                API.on_update_customer(decoded.payload)
                break;
            case DELETE:
                API.on_delete_customer(decoded.payload)
                break;
            case LOAD:
                API.on_load(decoded.payload)
                break;
            case SEARCH_REQUEST:
                API.on_search_request(decoded.payload)
                break;
            case SEARCH_RESPONSE:
                API.on_search_response(decoded.payload)
                break;
            case ACTIVATE_VIEW:
                API.on_activate_view(decoded.payload)
                break;
            case ACTIVATE_EDIT:
                API.on_activate_edit(decoded.payload)
                break;
            default:
        }
    }
}
