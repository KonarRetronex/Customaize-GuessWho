//find the box where the card should go
const cardGrid = document.getElementById("card-grid");

//start the loop for the cards
for (let i = 1; i <= 24; i++) {
    const card = document.createElement("figure");
    card.classList.add("card");

    card.innerHTML = `
        <div class="img-card-holder">
            <img class="chr-img" src="assets/imgHolder.png" alt="Character ${i}">
        </div>
        <figcaption class="card-name">Character ${i}</figcaption>
    `;

    cardGrid.appendChild(card);

}