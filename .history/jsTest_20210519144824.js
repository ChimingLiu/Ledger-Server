function  add() {
    return function (){
        let sumList = Array.from(arguments);
        for( i in arguments){
            console.log(i);
        }
        return 1;
    }
}
add(1,2,3,4);
console.log(a(1,2,3,4));
