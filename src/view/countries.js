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
