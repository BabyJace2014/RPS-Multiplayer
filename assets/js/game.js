/*
// Global Variables
*/

// Store the objects for each of the players
var player1 = null;
var player2 = null;

// Store the player names
var player1Name = '';
var player2Name = '';

// Store the name of the player in the user's browser
var yourPlayerName = '';

// Store the players choices
var player1Choice = '';
var player2Choice = '';

// Stores which player's turn it is
var turn = 1;

/*
// Firebase Database Section
*/

// Reference to the database service
var database = firebase.database();

// Attach a listener to the database /players/ node to listen for changes
database.ref("/players/").on("value", function(snapshot) {
    // Check for the existence of player 1 in the database
    if (snapshot.child("player1").exists()) {
        console.log("Player 1 exists");

        // Record player1 data
        player1 = snapshot.val().player1;
        player1Name = player1.name;

        // Update player1 data and stats
        $("#playerOneName").text(player1Name);
        $("#player1Stats").html("Wins: " + player1.win + ", Losses: " + player1.loss + ", Ties: " + player1.tie);
    } else {
        console.log("Player 1 does NOT exist");

        player1 = null;
        player1Name = '';

        // Update player1 display
        $("#playerOneName").text("Waiting for Player 1...");
        $("#playerPanel1").removeClass("playerPanelTurn");
        $("#playerPanel2").removeClass("playerPanelTurn");
        database.ref("/outcome/").remove();
        $("#roundOutcome").html("Rock-Paper-Scissors");
        $("#waitingNotice").html("");
        $("#player1Stats").html("Wins: 0, Losses: 0, Ties: 0");
    }

    // Check for the existence of player 2 in the database
    if (snapshot.child("player2").exists()) {
        console.log("Player 2 exists");

        // Record player2 data
        player2 = snapshot.val().player2;
        player2Name = player2.name;

        // Update player2 data and stats
        $("#playerTwoName").text(player2Name);
        $("#player2Stats").html("Wins: " + player2.win + ", Losses: " + player2.loss + ", Ties: " + player2.tie);
    } else {
        console.log("Player 2 does NOT exist");

        player2 = null;
        player2Name = '';

        // Update player2 display
        $("#playerTwoName").text("Waiting for Player 2...");
        $("#playerPanel1").removeClass("playerPanelTurn");
        $("#playerPanel2").removeClass("playerPanelTurn");
        database.ref("/outcome/").remove();
        $("#roundOutcome").html("Rock-Paper-Scissors");
        $("#waitingNotice").html("");
        $("#player2Stats").html("Wins: 0, Losses: 0, Ties: 0");
    }

    // If both players are present run game
    if (player1 && player2) {
        // Update display for player1 s turn
        $("#playerPanel1").addClass("playerPanelTurn");

        // Update the center display
        $("#waitingNotice").html("Waiting on " + player1Name + " to choose...");
    }
    
    // If both players leave the game, empty the chat session
    if (!player1 && !player2) {
        database.ref("/chat/").remove();
        database.ref("/turn/").remove();
        database.ref("/outcome/").remove();

        $("#chatDisplay").empty();
        $("#playerPanel1").removeClass("playerPanelTurn");
        $("#playerPanel2").removeClass("playerPanelTurn");
        $("#roundOutcome").html("Rock-Paper-Scissors");
        $("#waitingNotice").html("");
    }
});

// Attach a listener that detects user disconnection events
database.ref("/players/").on("child_removed", function(snapshot) {
    var msg = snapshot.val().name + " has disconnected!";

    // Get a key for the disconnection chat entry
    var chatKey = database.ref().child("/chat/").push().key;

    // Save the disconnection chat entry
    database.ref("/chat/" + chatKey).set(msg);
});

// Attach a listen to the database /chat/ node to listen for any new chat messages
database.ref("/chat/").on("child_added", function(snapshot) {
    var chatMsg = snapshot.val();
    var chatEntry = $("<div>").html(chatMsg);

    // Change the color of the chat message depending on user or connect/disconnect event
    if (chatMsg.includes("disconnected")) {
        chatEntry.addClass("chatColorDisconnected");
    } else if (chatMsg.includes("joined")) {
        chatEntry.addClass("chatColorJoined");
    } else if (chatMsg.startsWith(yourPlayerName)) {
        chatEntry.addClass("chatColor1");
    } else {
        chatEntry.addClass("chatColor2");
    }

    $("#chatDisplay").append(chatEntry);
    $("#chatDisplay").scrollTop($("#chatDisplay")[0].scrollHeight);
});

// Attach a listener database to the /turn/ node to listen for any changes
database.ref("/turn/").on("value", function(snapshot) {
    // Check if it's player1's turn
    if (snapshot.val() === 1) {
        console.log("Turn 1");
        turn = 1;

        // Update the display when both players are in the game
        if (player1 && player2) {
            $("#playerPanel1").addClass("playerPanelTurn");
            $("#playerPanel2").removeClass("playerPanelTurn");
            $("#waitingNotice").html("Waiting on " + player1Name + " to choose...");
        }
    } else if (snapshot.val() === 2) {
        console.log("Turn 2");
        turn = 2;

        if (player1 && player2) {
            $("#playerPanel1").removeClass("playerPanelTurn");
            $("#playerPanel2").addClass("playerPanelTurn");
            $("waitingNotice").html("Waiting on " + player2Name + " to choose...");
        }
    }
});

// Attach a listener to the database /outcome/ node to be notified of the game outcome
database.ref("/outcome/").on("value", function(snapshot) {
    $("#roundOutcome").html(snapshot.val());
});

/*
// Button Events Section
*/

// Attach an event handler to the "Submit" button to add a new user to the database
$("#add-name").on("click", function(event) {
    event.preventDefault();
    
    // Check that the name field is not empty and we are still waiting for a player
    if ( ($("#name-input").val().trim() !== '') && !(player1 && player2) ) {
        // Adding player 1
        if (player1 === null) {
            console.log("Adding Player 1");

            yourPlayerName = $("#name-input").val().trim();
            player1 = {
                name: yourPlayerName,
                win: 0,
                loss: 0,
                tie: 0,
                choice: ''
            };

            // Add player1 to the database
            database.ref().child("/players/player1").set(player1);

            // Set the turn value to 1, as player1 goes first
            database.ref().child("/turn").set(1);

            // If player1 disconnects by closing or refreshing the browser, remove player1 from the database
            database.ref("/players/player1").onDisconnect().remove();
        } else if ( (player1 !== null) && (player2 === null) ) {
            // Adding player2
            console.log("Adding Player 2");

            yourPlayerName = $("#name-input").val().trim();
            player2 = {
                name: yourPlayerName,
                win: 0,
                loss: 0,
                tie: 0,
                choice: ''
            };

            // Add player2 to the database
            database.ref().child("/players/player2").set(player2);

            // If player2 diconnects by closing or refreshing the browser, remove player2 from the database
            database.ref("/players/player2").onDisconnect().remove();
        }

        // Add a "user joining msg" to the chat
        var msg = yourPlayerName + " has joined!";
        console.log(msg);

        // Get a key for the join chat entry
        var chatKey = database.ref().child("/chat/").push().key;

        // Save the join chat entry
        database.ref("/chat/" + chatKey).set(msg);

        // Reset the input name box
        $("#name-input").val("");
    }
});

// Attach an event handler to the chat "send" button which appends the new message to the conversation
$("#chat-send").on("click", function(event) {
    event.preventDefault();

    // First, make sure that the player exists and the message box is not-empty
    if ( (yourPlayerName !== '') && ($("#chat-input").val().trim() !== '') ) {
        //Grab the message from the input box and subsequently reset the input box
        var msg = yourPlayerName + ": " + $("#chat-input").val().trim();
        $("#chat-input").val("");

        // Get a key fo the new chat entry
        var chatKey = database.ref().child("/chat/").push().key;

        // Save the new chat entry
        database.ref("/chat/" + chatKey).set(msg);
    }
});

// On Click event for Player1's selection
$("#playerPanel1").on("click", ".panelOption", function(event) {
    event.preventDefault();

    // Allow selections only when both players are in the game
    if (player1 && player2 && (yourPlayerName === player1.name) && (turn === 1) ) {
        // Record player1's choice
        var choice = $(this).text().trim();

        // Record the choice in firebase
        player1Choice = choice;
        database.ref().child("/players/player1/choice").set(choice);

        // Set the turn value to 2 for player2's turn
        turn = 2;
        database.ref().child("/turn").set(2);
    }
});

// On click event for Player2's selection
$("#playerPanel2").on("click", ".panelOption", function(event) {
    event.preventDefault();

    // Allow selections only when both players in the game
    if (player1 && player2 && (yourPlayerName === player2.name) && (turn ===2) ) {
        // Record player2's choice
        var choice = $(this).text().trim();

        // Record the choice in firebase
        player2Choice = choice;
        database.ref().child("/players/player2/choice").set(choice);

        // Run the compare function
        rpsCompare();
    }
});

// rpsCompare function to determine which player wins
function rpsCompare() {
    if (player1.choice === "Rock") {
        if (player2.choice === "Rock") {
            // Tie
            console.log("tie");

            database.ref().child("/outcome/").set("Tie game!");
            database.ref().child("/players/player1/tie").set(player1.tie + 1);
            database.ref().child("/players/player2/tie").set(player2.tie + 1);
        } else if (player2.choice === "Paper") {
            // Player2 wins
            console.log("paper wins");

            database.ref().child("/outcome/").set("Paper wins!");
            database.ref().child("/players/player1/loss").set(player1.loss + 1);
            database.ref().child("/players/player2/win").set(player2.win + 1);
        } else { // scissors
            // Player1 wins
            console.log("rock wins");
        
            database.ref().child("/outcome/").set("Rock wins!");
            database.ref().child("/players/player1/win").set(player1.win + 1);
            database.ref().child("/players/player2/loss").set(player2.loss + 1);
        }
    
    } else if (player1.choice === "Paper") {
        if (player2.choice === "Rock") {
            // Player1 wins
            console.log("paper wins");

            database.ref().child("/outcome/").set("Paper wins!");
            database.ref().child("/players/player1/win").set(player1.win + 1);
            database.ref().child("/players/player2/loss").set(player2.loss + 1);
        } else if (player2.choice === "Paper") {
            // Tie
            console.log("tie");

            database.ref().child("/outcome/").set("Tie game!");
            database.ref().child("/players/player1/tie").set(player1.tie + 1);
            database.ref().child("/players/player2/tie").set(player2.tie + 1);
        } else { // Scissors
            // Player2 wins
            console.log("scissors win");
        
            database.ref().child("/outcome/").set("Scissors win!");
            database.ref().child("/players/player1/loss").set(player1.loss + 1);
            database.ref().child("/players/player2/win").set(player2.win + 1);
        }
    
    } else if (player1.choice === "Scissors") {
        if (player2.choice === "Rock") {
            // Player2 wins
            console.log("rock wins");

            database.ref().child("/outcome/").set("Rock wins!");
            database.ref().child("/players/player1/loss").set(player1.loss +1);
            database.ref().child("/players/player2/win").set(player2.win + 1);
        } else if (player2.choice === "Paper") {
            // Player1 wins
            console.log("scissors win");

            database.ref().child("/outcome/").set("Scissors win!");
            database.ref().child("/players/player1/win").set(player1.win + 1);
            database.ref().child("/players/player2/loss").set(player2.win + 1);
        } else {
            // Tie
            console.log("tie");

            database.ref().child("/outcome/").set("Tie game!");
            database.ref().child("/players/player1/tie").set(player1.tie +1);
            database.ref().child("/players/player2/tie").set(player2.tie +1);
        }
    
    }

    // Set the turn value to 1, to now make it player1's turn
    turn =1;
    database.ref().child("/turn").set(1);
}