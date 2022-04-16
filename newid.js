function getUuiD(randomLength){
    return Number(Math.random().toString().substr(2,randomLength) + Date.now()).toString(36)
}

console.log(getUuiD(5));