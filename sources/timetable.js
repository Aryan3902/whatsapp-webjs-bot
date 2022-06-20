const timeTable = [["English","Abacus","Hindi","Maths","Games"],
["Art/Craft","English Gr","Hindi", "Maths", "Computer","English"],
["English Gr","English-Oral","Maths", "Hindi","Value Edu","Abacus"],
["English","Computer-Prac.","Hindi","Maths", "Hindi","Computer","Computer"],
["English","Maths","Abacus", "Value Edu","Games","Hindi"],
["English","Hindi","Maths","Computer","Maths","Hindi"],
["H","O","L","I","D","A","Y!"],
["H","O","L","I","D","A","Y!"]];

const d = new Date();
let day = d.getDay();
const tt = timeTable[day];

module.exports = tt;