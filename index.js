import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: "/*AnalysteDu95*/",
  port: 5433,
});
db.connect();
let currentUserId = 1;
let currentCategoryId = 1;
let items = [
  // { id: 1, title: "Buy milk" },
  // { id: 2, title: "Finish homework" },
];

async function getTodos() {
  const result = await db.query("SELECT items.id,* FROM categorie JOIN items ON items.categorie_id=categorie.id JOIN users on users.id=items.user_id WHERE items.categorie_id=$1 AND users.id=$2 ORDER by items.id ASC",[currentCategoryId,currentUserId]);
  // console.log(result);
  return result.rows;
}

async function getAllCategories(){
  let result =await db.query('select distinct(name),* from categorie order by id');
  // console.log(result)
  return result.rows
}
let categories=await getAllCategories();
// console.log(categories);

async function getCategory(id){
  let result =await db.query('select distinct(name),* from categorie where categorie.id=$1 ',[id]);
  // console.log(result)
  return result.rows
}
let getCat=await getCategory(currentCategoryId);
console.log(getCat);

async function allUsers(){
  let test=await db.query('Select * from users');
  return test;
}
let UsersAll=await allUsers();
let users=UsersAll.rows;

async function getUser(id){
  let UsersAll=await allUsers()
  let users=UsersAll.rows;
  return users.find((e)=>e.id==id)
}

app.get("/", async (req, res) => {
  try {
    console.log(currentCategoryId);
    let items=await getTodos();
    // let result=await db.query('Select * from items ORDER BY id ASC');
    let getCat=await getCategory(currentCategoryId);
    let theCat=getCat[0]; 
    let user=await getUser(currentUserId);
    console.log(user);
    let UsersAll=await allUsers();
    let users=UsersAll.rows;
    await res.render("index.ejs", {
      category:theCat,
      listTitle: theCat.name+" to DO",
      listItems: items,
      listCategories:categories,
      currentCategoryId,
      users,
      user
    });
  } catch (error) {
    console.log(error)
    res.redirect('/');
  }
});

app.get("/todo/:category", async (req, res) => {
  try {
    let category=req.params.category;
    let resultCat=categories.find(e=>category==e.name);
    console.log(resultCat);
    currentCategoryId=resultCat.id;
    res.redirect('/');
    // let result=await getTodo();;
    // // let result=await db.query('Select * from items ORDER BY id ASC');
    // console.log(result.rows);
    // console.log(categories);
    // items=result.rows;
    // await res.render("index.ejs", {
    //   listTitle: result.rows[0].name+" to DO",
    //   listItems: items,
    //   listCategories:categories,
    //   currentCategoryId,
    // });
  } catch (error) {
    console.log(error)
    res.redirect('/');
  }
});

app.post("/add", async (req, res) => {
  try {
    const item = req.body.newItem;
    console.log(currentUserId);
    if(item){
      let result = await db.query('insert into items(title, categorie_id, user_id) values ($1,$2,$3) returning *',[item,currentCategoryId, currentUserId]);
      console.log(result);
      res.redirect("/");
    }
    else{
      res.redirect('/');
    }
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

app.post("/edit", async(req, res) => {
  try {
    let {updatedItemId,updatedItemTitle }=req.body;
    console.log(updatedItemId,updatedItemTitle)
    let result = await db.query('UPDATE items SET title = $1 where items.id=$2',[updatedItemTitle, updatedItemId]);
    console.log(result);
    res.redirect("/");
  } catch (error) {
    console.log('HO NO ERROR DURING EDIT PROCESS',error)
    res.redirect('/');
  }
});

app.post("/delete", async (req, res) => {
  // res.send('heelllloo world');
  try {
    let {deleteItemId}=req.body;
    let result=await db.query('DELETE FROM items WHERE items.id = $1',[deleteItemId]);
    console.log(result);
    res.redirect('/');
  } catch (error) {
    res.redirect('/');
  }
});


/*Users road  */
app.post("/user", async (req, res) => {
  if(req.body.add){
    res.render('new.ejs');
  }
  else{
    let user=await req.body.user; //user.id
    console.log(user);
    currentUserId = user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  // console.log(req.body);
  let {name,color}=req.body;
  try {
    if(name && color){
      let result=await db.query('Insert Into users(name,color) values ($1,$2) RETURNING  *',[name,color]);
      console.log(result);
      currentUserId = result.rows[0].id;
      res.redirect('/');
    }
    else{
      throw new Error('name or color can\'t be null');
    }
  }catch (err){
    console.log(err);
    res.redirect('/')
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
