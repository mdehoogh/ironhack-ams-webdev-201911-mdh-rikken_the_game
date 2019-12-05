class PlayerBid{
    constructor(player,bid){
        this._player=player;
        this._bid=bid;
    }
    get bid(){return this._bid;}
    get player(){return this._player;}
}