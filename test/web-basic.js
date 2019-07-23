/*global describe it before*/
describe('Customers', () => {
    before(function (done) {
        setTimeout(
            () => done(),
            1900
        )
    })
    it('fill required fields and press submit should add new customer to a view', function (done) {
        const customer = {
            first_name: 'SuperSuperSuper',
            last_name: 'ManManManMan',
            email: 'super@man.com',
            country: 'Cyprus'
        }
        document.getElementById('first-name').value = customer.first_name
        document.getElementById('last-name').value = customer.last_name
        document.getElementById('email').value = customer.email
        document.getElementById('countries').value = customer.country
        document.getElementById('submit').click()
        setTimeout(
            () => {
                const custumer_element = document.getElementById('view').lastChild
                if (!custumer_element) return done('no customer element at view')
                const first_name = custumer_element.querySelector('.first-name').textContent
                if (first_name !== customer.first_name) return done('first name incorrect')
                const last_name = custumer_element.querySelector('.last-name').textContent
                if (last_name !== customer.last_name) return done('last name incorrect')
                const email = custumer_element.querySelector('.email').textContent
                if (email !== customer.email) return done('email incorrect')
                const country = custumer_element.querySelector('.country').textContent
                if (country !== customer.country) return done('country incorrect')
                done()
            },
            100
        )
    })
})
