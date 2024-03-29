const inquirer = require('inquirer');
const connect = require('./mySQLConnection');
const queryToPromise = require('./queryPromisify');
const cTable = require('console.table');

const connection = connect();

function Manager() {
  this.connection = () => {
    return connection;
  }
  this.start = () => {
    this.ask()
      .then(this.mapChoiceToFunction)
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        connection.end();
      })
  }
  this.ask = () => {
    return inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        choices: [
          'View Products for sale',
          'View Low Inventory',
          'Add to Inventory',
          'Add New Product'
        ]
      }
    ]);
  }
  this.mapChoiceToFunction = ({choice}) => {
    switch (choice) {
      case 'View Products for sale': return this.showProducts();
      case 'View Low Inventory': return this.showLowInvetory();
      case 'Add to Inventory': return this.addToInventoryAsk();
      case 'Add New Product': return this.addNewProductAsk();
    }
  }
  this.showProducts = () => {
    return queryToPromise(connection, 'SELECT * from products')
      .then((data) => {
        console.table(data);
        return data;
      })
  };
  this.showLowInvetory = () => {
    return queryToPromise(connection, 'SELECT * from products WHERE stock_quantity < 5')
      .then((data) => {
        console.table(data);
        return data;
      })
  }
  this.addToInventoryAsk = () => {
    return inquirer.prompt([
      {
        type: 'input',
        name: 'id',
        message: 'Please specify an ID to add more inventory'
      },
      {
        type: 'input',
        name: 'quantity',
        message: 'Please provide the quantity',
        validate: (value) => parseInt(value) ? true : false,
      }
    ])
      .then(this.addToInventory);
  }
  this.addToInventory = ({ id, quantity }) => {
    return queryToPromise(connection, 'UPDATE products SET stock_quantity = ? WHERE item_id = ?', [quantity, id])
      .then((data) => {
        if (data.affectedRows === 0) {
          throw 'Item does not exist in the database';
        } else {
          console.log('Item Has been updated');
          return data;
        }
      })
  }
  this.addNewProductAsk = () => {
    return inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Please provide the name of the product'
      },
      {
        type: 'input',
        name: 'department',
        message: 'Please provide the department location'
      },
      {
        type: 'input',
        name: 'price',
        message: 'Please provide the price of the item',
        validate: (value) => parseInt(value) ? true : false,
      },
      {
        type: 'input',
        name: 'quantity',
        message: 'Please provide stock total',
        validate: (value) => parseInt(value) ? true : false,
      }
    ])
    .then(this.addNewProduct);
  }
  this.addNewProduct = ({name, department, price, quantity}) => {
    return queryToPromise(connection, 'INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES (?,?,?,?)', [name, department, price, quantity])
    .then((data) => {
      if (data.affectedRows === 0) {
        throw 'Item already exists in store';
      } else {
        console.log('Item Has been added to store');
        return data;
      }
    })
  }
}

module.exports = Manager;