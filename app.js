const { format, isValid } = require("date-fns");
const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

const formatDate = (req, res, next) => {
  const { dueDate } = req.query;
  if (dueDate !== undefined) {
    const formattedDate = format(new Date(dueDate.split("-")), "yyyy-MM-dd");
    req.query.dueDate = formattedDate;
    next();
  }
  const { date } = req.query;
  if (date !== undefined) {
    const formattedDate = format(new Date(date.split("-")), "yyyy-MM-dd");
    req.query.date = formattedDate;
    next();
  }
};

const validateData = (req, res, next) => {
  const { priority, status, category, dueDate } = req.query;
  if (
    !(
      priority === "HIGH" ||
      priority === "MEDIUM" ||
      priority === "LOW" ||
      priority === undefined
    )
  ) {
    res.status(400);
    res.send("Invalid Todo Priority");
  } else if (
    !(
      status === "TO DO" ||
      status === "DONE" ||
      status === "IN PROGRESS" ||
      status === undefined
    )
  ) {
    res.status(400);
    res.send("Invalid Todo Status");
  } else if (
    !(
      category === "WORK" ||
      category === "HOME" ||
      category === "LEARNING" ||
      category === undefined
    )
  ) {
    res.status(400);
    res.send("Invalid Todo Category");
  } else next();
};

const validateBodyData = (req, res, next) => {
  const data = req.body;
  const { priority, status, category } = data;
  if (
    !(
      priority === "HIGH" ||
      priority === "MEDIUM" ||
      priority === "LOW" ||
      priority === undefined
    )
  ) {
    res.status(400);
    res.send("Invalid Todo Priority");
  } else if (
    !(
      status === "TO DO" ||
      status === "DONE" ||
      status === "IN PROGRESS" ||
      status === undefined
    )
  ) {
    res.status(400);
    res.send("Invalid Todo Status");
  } else if (
    !(
      category === "WORK" ||
      category === "HOME" ||
      category === "LEARNING" ||
      category === undefined
    )
  ) {
    res.status(400);
    res.send("Invalid Todo Category");
  } else next();
};

const validateDate = (req, res, next) => {
  const { date } = req.query;
  if (date === undefined) {
    next();
  } else if (isValid(new Date(date))) {
    next();
  } else {
    res.status(400);
    res.send("Invalid Due Date");
  }
};

const validateBodyDate = (req, res, next) => {
  const data = req.body;
  const { dueDate } = data;
  if (dueDate === undefined) {
    next();
  } else if (isValid(new Date(dueDate))) {
    next();
  } else {
    res.status(400);
    res.send("Invalid Due Date");
  }
};

app.use(express.json());

app.get("/todos/", validateData, async (req, res) => {
  const {
    category = undefined,
    status = undefined,
    priority = undefined,
    search_q = undefined,
  } = req.query;
  let query = `
        SELECT * FROM todo
        `;
  if (
    category !== undefined ||
    status !== undefined ||
    priority !== undefined ||
    search_q !== undefined
  )
    query += ` where `;
  if (category !== undefined) {
    query += ` category = "${category}" `;
  }
  if (status !== undefined) {
    if (category !== undefined) query += ` AND `;
    query += ` status = "${status}" `;
  }
  if (priority !== undefined) {
    if (category !== undefined || status !== undefined) query += ` AND `;
    query += ` priority = "${priority}" `;
  }
  if (search_q !== undefined) {
    if (
      category !== undefined ||
      status !== undefined ||
      priority !== undefined
    )
      query += ` AND `;
    query += ` todo like "%${search_q}%" `;
  }
  query += `;`;
  const todoList = await db.all(query);
  res.send(todoList);
});

app.get("/todos/:todoId/", validateData, async (req, res) => {
  const { todoId } = req.params;
  const query = `
    SELECT * FROM todo
    where id = "${todoId}";`;
  const todoData = await db.get(query);
  res.send(todoData);
});

app.get("/agenda/", validateDate, formatDate, async (req, res) => {
  const { date } = req.query;
  const query = `
        SELECT * FROM todo
        where due_date = "${date}";`;
  const todoData = await db.get(query);
  res.send(todoData);
});

app.post("/todos/", validateBodyData, validateBodyDate, async (req, res) => {
  const todoData = req.body;
  const { id, todo, category, priority, status, dueDate } = todoData;
  const query = `
        INSERT INTO todo(id, todo, category, priority, status, due_date)
        VALUES ("${id}", "${todo}", "${category}", "${priority}", "${status}", "${dueDate}");`;
  const dbResponse = await db.run(query);
  console.log(query);
  res.send("Todo Successfully Added");
});

app.put(
  "/todos/:todoId",
  validateBodyData,
  validateBodyDate,
  async (req, res) => {
    const { todoId } = req.params;
    const todoData = req.body;
    const { status, todo, priority, dueDate, category } = todoData;
    let query = `
        UPDATE todo
        SET `;
    let responseText = "";
    let alreadyAdded = false;
    if (status !== undefined) {
      query += ` status = "${status}" `;
      alreadyAdded = true;
      responseText = "Status";
    }
    if (todo !== undefined) {
      if (alreadyAdded) query += `,`;
      query += ` todo = "${todo}" `;
      alreadyAdded = true;
      responseText = "Todo";
    }
    if (priority !== undefined) {
      if (alreadyAdded) query += ",";
      query += ` priority = "${priority}"`;
      alreadyAdded = true;
      responseText = "Priority";
    }
    if (category !== undefined) {
      if (alreadyAdded) query += ",";
      query += ` category = "${category}"`;
      alreadyAdded = true;
      responseText = "Category";
    }
    if (dueDate !== undefined) {
      if (alreadyAdded) query += ",";
      query += ` due_date = "${dueDate}"`;
      alreadyAdded = true;
      responseText = "Due Date";
    }
    const dbResponse = await db.run(query);
    res.send(responseText + " Updated");
  }
);

app.delete("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const query = `
        DELETE  FROM todo
        where id = "${todoId}";`;
  const todoData = await db.get(query);
  res.send("Todo Deleted");
});

initializeDBAndServer();

module.exports = app;
