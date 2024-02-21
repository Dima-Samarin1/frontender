function mobileNav() {
	// Mobile nav button
	const navBtn = document.querySelector('.mobile-nav-btn')
	const nav = document.querySelector('.mobile-nav')
	const menuIcon = document.querySelector('.nav-icon')

	// Get all the links inside the mobile nav
	const links = nav.querySelectorAll('a')

	// Function to close the mobile nav
	function closeNav() {
		nav.classList.remove('mobile-nav--open')
		menuIcon.classList.remove('nav-icon--active')
		document.body.classList.remove('no-scroll')
	}

	// Add click event listeners to each link
	links.forEach(link => {
		link.addEventListener('click', closeNav)
	})

	// Toggle the mobile nav when the nav button is clicked
	navBtn.onclick = function () {
		nav.classList.toggle('mobile-nav--open')
		menuIcon.classList.toggle('nav-icon--active')
		document.body.classList.toggle('no-scroll')
	}
}

export default mobileNav
