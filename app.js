//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

require("dotenv").config("./.env");

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

mongoose.connect(process.env.DB_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome! to Todo-List.",
});
const item2 = new Item({
  name: "press + button to add a new Task.",
});
const item3 = new Item({
  name: "<-- Hit! this to delete an Task",
});

const listsSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listsSchema);

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  // const day = date.getDate();
  Item.find({}, function (err, result) {
    if (result.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Data is saved successfully into your list");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: result,
      });
    }
  });
});

app.post("/", function (req, res) {
  const itemAdded = req.body.newItem;
  const listName = req.body.list;
  const itemAdd = new Item({
    name: itemAdded,
  });

  if (listName === "Today") {
    itemAdd.save();
    res.redirect("/");
  } else {
    List.findOne(
      {
        name: listName,
      },
      function (err, foundedList) {
        foundedList.items.push(itemAdd);
        foundedList.save();
        res.redirect("/" + listName);
      }
    );
  }
});

app.post("/delete", function (req, res) {
  const checkedId = req.body.checkbox;
  const itemsList = req.body.itemListName;
  if (itemsList === "Today") {
    Item.findOneAndDelete(checkedId, function (err) {
      if (!err) {
        console.log("The selected item is removed successfully...");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      {
        name: itemsList,
      },
      {
        $pull: {
          items: {
            _id: checkedId,
          },
        },
      },
      function (err, foundedList) {
        if (!err) {
          res.redirect("/" + itemsList);
        }
      }
    );
  }
});

app.get("/:customListname", function (req, res) {
  const customListName = _.capitalize(req.params.customListname);
  List.findOne(
    {
      name: customListName,
    },
    function (err, result) {
      if (!err) {
        if (!result) {
          const list = new List({
            name: customListName,
            items: defaultItems,
          });

          list.save();
          res.redirect("/" + customListName);
        } else {
          res.render("list", {
            listTitle: customListName,
            newListItems: result.items,
          });
        }
      }
    }
  );
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port, function () {
  console.log("Server has started Successfully");
});
