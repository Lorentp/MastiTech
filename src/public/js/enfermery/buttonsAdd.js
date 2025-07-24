const addCowButton = document.getElementById("addCowButton")
const deleteCowButton = document.getElementById("deleteCowButton")
const addTreatmentButton = document.getElementById("addTreatmentButton")
const deleteTreatmentButton= document.getElementById("deleteTreatmentButton")

const addCowForm = document.getElementById("addCowForm")
const deleteCowForm = document.getElementById("deleteCowForm")
const addTreatmentForm = document.getElementById("addTreatmentForm")
const deleteTreatmentForm= document.getElementById("deleteTreatmentForm")



function showOrHideElement(e) {
    if(e.classList.contains("hidden")){
        e.classList.remove("hidden")
        window.scroll({
            top: document.body.scrollHeight * (40/100),
            behavior: "smooth"
        })
    } else {
        e.classList.add("hidden")
    }
}

function activeButton(button){
    button.classList.toggle("active")
}

addCowButton.addEventListener("click", function() {
    showOrHideElement(addCowForm)
    activeButton(this)
})


deleteCowButton.addEventListener("click", function() {
    showOrHideElement(deleteCowForm)
    activeButton(this)
})

addTreatmentButton.addEventListener("click", function() {
    showOrHideElement(addTreatmentForm);
    activeButton(this)
});


deleteTreatmentButton.addEventListener("click", function() {
    showOrHideElement(deleteTreatmentForm);
    activeButton(this)
});




