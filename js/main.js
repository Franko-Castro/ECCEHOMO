const reveals =
document.querySelectorAll(".reveal");

window.addEventListener("scroll", () => {

reveals.forEach(item => {

const top =
item.getBoundingClientRect().top;

if(top < window.innerHeight - 100){
item.classList.add("active");
}

});

});