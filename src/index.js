const express = require('express');
const cors = require('cors');

require('./db/mongoose');

const userRouter = require('./routers/users');
const productsRouter = require('./routers/products');
const categoriesRouter = require('./routers/categories');
const orderRouter = require('./routers/orders');

const app = express();
app.use(cors());
app.use('*', cors()); // to allow other apps from front-end have access to the http request
app.use('/uploads', express.static('uploads'));

const port = process.env.PORT;

app.use(express.json());

app.use(userRouter, productsRouter, orderRouter); //registry routers
app.use(categoriesRouter);


app.listen(port, () => {
    console.log('Listening on port ' + port)
});