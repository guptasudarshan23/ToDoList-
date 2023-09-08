//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-sudarshan:test123@atlascluster.xl8o8zo.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to ToDoList"
});

const item2 = new Item({
  name: "Hit the + button to add a new item!"
});

const defaultItems = [item1, item2];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({})
  .then(foundItems => {
    if (foundItems.length === 0){
      Item.insertMany(defaultItems)
        .then(() => {
          console.log("Successfully saved default items to DB");
        })
        .catch(err => {
          console.log(err);
        });
        res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
    })
    .catch(err => {
      console.log(err);
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(foundList => {
      if (!foundList) {
        List.findOne({ name: customListName })
          .then(existingList => {
            if (!existingList) {
              const list = new List({
                name: customListName,
                items: defaultItems
              });
              list.save();
              res.redirect("/" + customListName);
            }
          })
          .catch(err => {
            console.log(err);
            // Handle any errors that occur during list creation and saving.
          });
        // You can render a custom error page or send an appropriate response here.
      } else {
          res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(err => {
      console.log(err);
      // Handle any errors that occur during the database query.
      // You can render an error page or send an appropriate response here as well.
    });

  // Create a new list and save it, but only if it doesn't already exist

});






app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save()
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/");
      });
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        if (foundList) {
          foundList.items.push(item);
          return foundList.save();
        } else {
          throw new Error("List not found");
        }
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
        // Handle any errors that occur during list item creation, saving, or list not found.
        // You can render an error page or send an appropriate response here.
        res.redirect("/" + listName); // Redirect back to the list page if there's an error.
      });
  }
});

app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try {
    if (listName === "Today") {
      await Item.findByIdAndRemove(checkedItemId);
      console.log("Successfully deleted checked item");
      res.redirect("/");
    } else {
      await List.updateOne(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});






app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
