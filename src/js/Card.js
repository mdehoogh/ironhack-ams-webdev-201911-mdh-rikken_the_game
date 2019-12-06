/**
 * definition of a playing Card
 */
String.prototype.capitalize=function(){
    return (this.length>0?this[0].toUpperCase()+this.slice(1):this);
}

const SUITE_NAMES=["diamond","club","heart","spade"];
const RANK_NAMES=["two","three","four","five","six","seven","eight","nine","ten","jack","queen","king","ace"];
// shorthand 'characters' for textual representation
// NOT WORKING: const CARD_SUITE_CHARACTERS=[String.fromCharCode(2666),String.fromCharCode(2663),String.fromCharCode(2665),String.fromCharCode(2660)];
const SUITE_CHARACTERS=['\u2666','\u2663','\u2665','\u2660']; // YES, WORKING!!!!!
const SUITE_DIAMOND=0,SUITE_CLUB=1,SUITE_HEART=2,SUITE_SPADE=3;
const RANK_CHARACTERS=['2','3','4','5','6','7','8','9','10','B','V','K','A'];
const RANK_TWO=0,RANK_THREE=1,RANK_FOUR=2,RANK_FIVE=3,RANK_SIX=4,RANK_SEVEN=5,RANK_EIGHT=6,RANK_NINE=7,RANK_TEN=8,RANK_JACK=9,RANK_QUEEN=10,RANK_KING=11,RANK_ACE=12;

class Card{

    constructor(cardSuiteIndex,cardNameIndex){
        this._cardSuiteIndex=cardSuiteIndex;
        this._cardNameIndex=cardNameIndex;
    }
    toString(){
        return RANK_NAMES[this._cardNameIndex].capitalize()+" of "+SUITE_NAMES[this._cardSuiteIndex]+"s";
    }
    
    get rank(){return this._cardNameIndex;}
    get suite(){return this._cardSuiteIndex;}

    getTextRepresentation(){return SUITE_CHARACTERS[this._cardSuiteIndex].concat(RANK_CHARACTERS[this._cardNameIndex]);}

}

function compareCards(card1,card2){
    let deltaSuite=card1._cardSuiteIndex-card2._cardSuiteIndex;
    if(deltaSuite!=0)return deltaSuite;
    return card1._cardNameIndex-card2._cardNameIndex;
}

// in a trick the play suite determines what cards are to be played, the trump suite determines what trump is
function compareCardsWithPlayAndTrumpSuite(card1,card2,playSuite,trumpSuite){
    // normally with any two regular cards they are never equal in a trick
    // cards that are neither play suite or trump suite is irrelevant
    let result=0;
    let type='-';
    // 1. if card1 is trump, and card2 is not or has a lower rank card1 wins
    if(card1.suite==trumpSuite){result=(card2.suite!=trumpSuite?1:card1.rank-card2.rank);type='A';}else
    // ASSERT card1 is NOT trump but card2 could still be trump
    if(card2.suite==trumpSuite){result=-1;type='B';}else
    // ASSERT neither card is trump, so could be play suite or not...
    if(card1.suite==playSuite){result=(card2.suite!=playSuite?1:card1.rank-card2.rank);type='C';}else
    // ASSERT card1 is not play suite, but card2 could be
    if(card2.suite==playSuite){result=-1;type='D';}
    console.log('>>> Type: '+type+': '+card1.getTextRepresentation()+"(suite: "+card1.suite+")"+(result>0?' > ':(result<0?' < ':' = '))+card2.getTextRepresentation()+" (suite: "+card2.suite+")"+" (play: "+(playSuite>=0?SUITE_NAMES[playSuite]:"?")+", trump:"+((trumpSuite>=0?SUITE_NAMES[trumpSuite]:"?"))+")");
    return result;
    /* replacing:
    // let's first recompute the suite of both cards and elevate trump cards, and deevaluate non playSuite cards
    let card1Suite=(card1.suite==trumpSuite?4:(card1.suite!=playSuite?-1:card1.suite));
    let card2Suite=(card1.suite==trumpSuite?4:(card2.suite!=playSuite?-1:card2.suite));
    if(card1Suite>=0||card2Suite>=0){ // at least one of the cards is play suite or trump suite
        // if the suites are the same the highest rank wins
        if(card1Suite<0)return -1; // if the first card is irrelevant, the first card is lower
        if(card2Suite<0)return 1; // if the second card is irrelevant, the first card is higher
        // ASSERT both cards are either play suite or trump suite
        if(card1Suite==card2Suite)return card1.rank-card2.rank;
        // ASSERT one card is play suite, the other must be trump suite
        return(card1Suite==4?1:-1);
    }
    */
    // ASSERT neither card is play suite or trump suite, both cards are irrelevant (should happen though)
    return 0; // considered equal that is irrelevant
}