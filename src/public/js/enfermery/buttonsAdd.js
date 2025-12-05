const addCowButton = document.getElementById("addCowButton")
const addOtherTreatmentButton = document.getElementById("addOtherTreatmentButton")
const deleteCowButton = document.getElementById("deleteCowButton")
const addTreatmentButton = document.getElementById("addTreatmentButton")
const deleteTreatmentButton= document.getElementById("deleteTreatmentButton")
const addCultureButton = document.getElementById("addCultureButton")

const addCowForm = document.getElementById("addCowForm")
const addOtherTreatmentForm = document.getElementById("addOtherTreatmentForm")
const deleteCowForm = document.getElementById("deleteCowForm")
const addTreatmentForm = document.getElementById("addTreatmentForm")
const deleteTreatmentForm= document.getElementById("deleteTreatmentForm")
const addCultureForm = document.getElementById("addCultureForm")



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

addOtherTreatmentButton.addEventListener("click", function() {
    showOrHideElement(addOtherTreatmentForm)
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

addCultureButton.addEventListener("click", function() {
    showOrHideElement(addCultureForm);
    activeButton(this)
});



