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
