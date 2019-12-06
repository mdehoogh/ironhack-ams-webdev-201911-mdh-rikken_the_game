# ironhack-ams-webdev-201911-mdh-rikken_the_game
Four player card game (typically) played in the province of Brabant and Limburg in The Netherlands and in Belgium.

Disclaimer: Still under development. Use at your own risk.

Base classes:
Card            defines a Card with a given suite and rank
HoldableCard    a subclass of Card that to be stored in a CardHolder instance; in order to move such a card
                from one CardHolder to the other its holder property should be assigned to; the removeCard and
                addCard methods themselves should NOT be called directly, the holder setter takes care of that.
CardHolder      to hold cards (should not be instantiated)

Player          defines a basic (Rikken game) player, a subclass of CardHolder that will use prompt to ask for                    bids and cards to play (used in the early stage of development, not completely functional so not                  to be instantiated anymore)
EmulatedPlayer  a subclass of player that is used when certain players are not presented to the game (i.e. when                   null)
OnlinePlayer    a subclass of Player that is used by the web page (index.html) delegating input to the web page

DeckOfCards     a subclass of CardHolder to hold all 52 cards at the start of the playing the game,
                instantiated and populated with the cards by the game

RikkenTheGame   the class that takes care of playing the game, it should be provided with an array containing
                at least four Player instances, typically OnlinePlayer instances.
                Null elements in the array are replaced by EmulatedPlayer instances, but EmulatedPlayer is not
                operational yet, so the game can only be played with four OnlinePlayer instances.
                This is done by entering four names on the game setup page
Trick           A trick will hold at most 4 cards, and playing a game means playing 13 tricks in total.
                The trick is passed to any player that is supposed to play a card next. The game keeps track
                of who the winner is. The winner of a trick becomes the first to play a card in the next trick.
                Because the card and game do not communicate directly, the trick is instantiated by the game 
                with crucial information to the player that is to play a card.

Web interface
-------------
The web interface consists of several pages that act as a wizard. 
As it is supposed to be played by Dutch people, Dutch is used as language in the interface.
In the application itself, English is dominantly used. In due course an English language UI should also be created.

Page 1. Playing rules
---------------------
'Rikken' is a card game that can be hard to learn how to play initially. Read the rules to understand why that is so.

Page 2. Settings
----------------
Yet to be completed. Many variations exists between different regions of how to play the game. One could say that the current implementation is that of the city of Oosterhout in Noord-Brabant where I was born.

Page 3. Choosing player names
-----------------------------
Although the game is played with four card holding and playing entities, it is possible to play with 5 (or more perhaps) persons. In the five person setup, the player dealing the cards would not participate in the game being
played. So (s)he can go and do something else after having dealt the cards.
At the moment only and all of the first four player names need to be entered for the game to be (more or less) playable.

Page 4. Bidding
---------------
After dealing the cards, bidding will occur unless any of the players has exactly three aces, in which case
the game of 'troela' is obligatory, and no further bidding will occur.
'Troela' should in practice always be reported, this online game will take care of that. If it detects 'troela'
it will automatically determine who the partner of the player with three aces will be, and start the card playing.
If 'troela' does not occur, each of the players in turn and clockwise gets the opportunity to bid. However, once a player stops bidding (by bidding 'pas') (s)he can not bid any longer. The bids in which a player intends to play by himself to either collect no tricks or exactly one trick can be played simultaneously by any player, if need be all, i.e. when they are still allowed to bid.
Troela, and the 'rik' or 'rik beter' bid are played by a team of two players, one player that thinks he has enough
and/or sufficiently high cards of a certain suite (we typically call that a 'kleur' i.e. color) to be able to make eight tricks together with another player, using that color as trump color. This player is selected by this 'rikker' by mentioning the ace that player should possess (after his bid came out highest). Any ace except the trump ace can be choosen. Now, if the 'rikker' has all of these aces him/herself, a king must be choosen. It is unlikely that (s)he will also have all kings. I have never encountered that situation, but if that happens in the game this game simply continues with queens etcetera. Not that that will ever happen though, but you never know!
Once the bidding is over, as detected by the game logic, the 'rikker' is allowed to select the trump suite and the suite of the ace or king (or queen) his partner should have. If a game with trump is played solitary only the trump color is requested, and not the partner ace/king/queen/... suite.

Page 5. Choosing the trump suite
--------------------------------
As indicated. At the moment the game does not yet check whether the 'rikker' actually has the selected suite.
Yet to be implemented.

Page 6. Choosing the partner ace/king/queen/... suite
-----------------------------------------------------
Same here.

Page 7. Playing
---------------
In the future we imagine this game to be played 'over the internet' i.e. with four players that could be anywhere on their own computer/laptop/smart phone, playing together. Or, perhaps, a single person might use the game to get acquainted with the game, and have the game emulate the other three players. If multiple persons use the same phone to play the game, it would be problematic if one could alway see the other players cards. To this purpose the non-demo mode hides the cards of a player (during bidding and playing) by default, so once a player knows the screen is not observable by the other player(s) (s)he can open the collapsed part showing his/her playing cards.
In the demo mode all the tricks played so far will be shown out in the open for demonstrational (and need I say debugging) purposes, so one can inspect the tricks, and learn from it. In reality one is only allowed to inspect the trick before the current trick, i.e. older tricks are no longer inspectable. (This however also needs to be implemented.)

Further considerations
----------------------
It proves to be hard to develop, test and debug a game like this in a weeks time, even for me, and make it work.
I suspect that, apart from the various ways the UI could be improved upon (a UI/UX designer's job more likely), it might take quite some effort to allow it being used by four actual players, but that's doable. Making it commercially attractive will take too much time and effort for me to spare. Nevertheless I intend to make it usable before the end of the bootcamp.

Marc P. de Hoogh
Web game as developed in Week 3 of the Ironhack Web Development Bootcamp Amsterdam, November 2019











