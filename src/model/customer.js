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
