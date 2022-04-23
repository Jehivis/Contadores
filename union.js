const express = require('express');
const moment = require('moment')
const router = express.Router();

//Models
const Counter = require('./models/CounterPeople');
const CounterUnion = require('./models/CounterUnion');


const union = async (req, res) => {
    console.log("Entre");
    let today = new Date();
    let todayGuatemala = new Date();
     console.log("Entre");
    todayGuatemala.toLocaleString('es-US', { timeZone: 'America/Guatemala' });
    let todayFormat = moment(today).format('YYYY-MM-DD')
    let showDataCounter = await Counter.find({
        $or:[{'in':{$gt: 0}}, {'out':{$gt: 0}}],
        from: { $gte: `${todayFormat}T08:00:00.000Z`, $lt: `${todayFormat}T23:59:59.000Z` }
    },{to: 1, in: 1, out:1, store: 1 });
    let tiendasEntradas =[];
    let tiendasPasadas = [];
    console.log("Pase");
    await showDataCounter.map((counters) => {
        if(tiendasPasadas.includes(counters.store) ==  false){
            tiendasEntradas[counters.store] =  {store:'', in:0, out:0, date:''};
            tiendasPasadas.push(counters.store);
        }
        tiendasEntradas[counters.store].store = counters.store;
        tiendasEntradas[counters.store].date = todayGuatemala;
        tiendasEntradas[counters.store].in = tiendasEntradas[counters.store].in + counters.in;  
        tiendasEntradas[counters.store].out = tiendasEntradas[counters.store].out + counters.out;
    });
    console.log(tiendasPasadas);
    tiendasPasadas.map(async(tiendas) =>{
        const showCounter = {
            date:tiendasEntradas[tiendas].date,
            in: tiendasEntradas[tiendas].in,
            out: tiendasEntradas[tiendas].out,
            store: tiendasEntradas[tiendas].store
        };
        const insertData = CounterUnion(showCounter);
        await insertData.save();
    });
    
    return {"Message":"Datos Ingresados"};
};
union();
module.exports = router;