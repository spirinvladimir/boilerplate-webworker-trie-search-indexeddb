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
