const express = require('express');
const moment = require('moment')
const router = express.Router();

//Models
const Counter = require('../models/CounterPeople');
const CounterUnion = require('../models/CounterUnion');

router.post("/counter", async(req, res) => {
    
    if (req.body.data.measurements) {
        const createCounter = {
            to: "",
            from: "",
            in: 0,
            out: 0,
            store: ""
        };
        
        createCounter.store = req.body.sensor.name;
        req.body.data.measurements.map(async(measurement) =>{
    
            var toConvert = new Date(req.body.data.to);
            createCounter.to = toConvert.toLocaleString('en-US', { timeZone: 'America/Guatemala' });

            var fromConvert = new Date(req.body.data.from);
            createCounter.from = fromConvert.toLocaleString('en-US', { timeZone: 'America/Guatemala' });

            measurement.items.map(async(item) =>{
                if(item.direction === 'in'){
                    createCounter.in = item.count;
                }else{
                    createCounter.out = item.count;
                }
            });
           
            const insertData = Counter(createCounter);
            if(createCounter.in > 0 || createCounter.out > 0){
                await insertData.save();
                let todayFormatUnion = moment(new Date(createCounter.from)).format('YYYY-MM-DD');
                let showDataCounterUnion = await CounterUnion.find({
                    date: `${todayFormatUnion}T18:20:59.000+00:00`,
                    store: createCounter.store
                }).limit(1);
                console.log(showDataCounterUnion.length);
                if(showDataCounterUnion.length <= 0){
                    console.log(1);
                    const showCounterUnion = {
                        date:todayFormatUnion+"T18:20:59.000+00:00",
                        in: createCounter.in,
                        out: createCounter.out,
                        store: createCounter.store
                    };
                    const insertDataUnion = CounterUnion(showCounterUnion);
                    await insertDataUnion.save();
                }else{
                    console.log(2);
                    let inPerson = showDataCounterUnion[0].in + createCounter.in;
                    let outPerson = showDataCounterUnion[0].out + createCounter.out;
                    let myquery = { _id: showDataCounterUnion[0].id };
                    let countPersonInfo = {
                        in: inPerson,
                        out: outPerson
                    }

                    await CounterUnion.updateOne(myquery, countPersonInfo);
                }
                
                console.log("Se guardo");
            }else{
                console.log("No se guardo");
            }
        });
        return res.status(200).json({ message: "Exito" });

    } else {
        console.log("measurements vacio");
        return res.status(400).json({ message: "Error Vacio" });
    }

    
});

router.get("/data-counter", async(req, res) => {
    
    let showDataCounter = await CounterUnion.find();
    const counterPush = [];
    showDataCounter.map(counters => {

        const showCounter = {
            fecha: "",
            entrada: 0,
            salida: 0,
            tienda: ""
        };

        showCounter.fecha = new Date(counters.date);
        showCounter.entrada = counters.in;
        showCounter.salida = counters.out;
        showCounter.tienda = counters.store;

        counterPush.push(showCounter);
    });

    console.log(counterPush.length);
    return res.status(200).json(counterPush);
});

router.get("/data-counter/:dateInit/:dateEnd", async(req, res) => {
    const { dateInit, dateEnd } = req.params;
    if(moment(dateInit, 'YYYY-MM-DD',true).isValid() && moment(dateEnd, 'YYYY-MM-DD',true).isValid()){
    if(new Date(dateInit) <= new Date(dateEnd)){
    let showDataCounter = await Counter.find({ 
            $or:[{'in':{$gt: 0}}, {'out':{$gt: 0}}], 
            from: { $gte: `${dateInit}T06:10:00.000Z`, $lt: `${dateEnd}T05:59:00.000Z` }
        },{to: 1, from: 1, in: 1, out: 1, store: 1 })
    const counterPush = [];
    showDataCounter.map(counters => {

        const showCounter = {
            horaInicio: "",
            horaFinal: "",
            entrada: 0,
            salida: 0,
            tienda: ""
        };

        var fromConvert = new Date(counters.from);
        showCounter.horaInicio = fromConvert.toLocaleString('es-US', { timeZone: 'America/Guatemala' });

        var toConvert = new Date(counters.to);
        showCounter.horaFinal = toConvert.toLocaleString('es-US', { timeZone: 'America/Guatemala' });

        showCounter.entrada = counters.in;
        showCounter.salida = counters.out;
        showCounter.tienda = counters.store;

        counterPush.push(showCounter);
    });

    console.log(counterPush.length);
    return res.status(200).json(counterPush);

    }else{
        return res.status(400).json({ message: "Error, fecha mal ingresada" });
    }
    }else{
        return res.status(400).json({ message: "Error, fechas en formato incorrecto" });
    }
});

router.get("/dataGroup", async(req, res) => {
    //Dias
    let today = '2021-10-05T18:20:59.000Z';
    let tomorrow = '2021-10-06T10:20:59.000Z';
    //Convert Date
    let todayDate = new Date(today);
    let todayGuatemalaDate = new Date(today);
    let tomorrowDate = new Date(tomorrow);
    //Guatemala
    todayGuatemalaDate.toLocaleString('es-US', { timeZone: 'America/Guatemala' });
    //Formate YYY-MM-DD
    let todayFormat = moment(today).format('YYYY-MM-DD');
    let tomorrowFormat = moment(tomorrowDate).format('YYYY-MM-DD');

    //console.log("--------",todayFormat,tomorrowFormat, new Date(`${todayFormat}T05:59:00.000Z`).toLocaleString('es-US', { timeZone: 'America/Guatemala' }), new Date(`${tomorrowFormat}T05:59:00.000Z`).toLocaleString('es-US', { timeZone: 'America/Guatemala' }))
    let showDataCounter = await Counter.find({
        $or:[{'in':{$gt: 0}}, {'out':{$gt: 0}}],
        from: { $gte: `${todayFormat}T06:10:00.000Z`, $lt: `${tomorrowFormat}T05:59:00.000Z` }
    },{from: 1, in: 1, out:1, store: 1 })

    let tiendasEntradas =[];
    let tiendasPasadas = [];
    await showDataCounter.map((counters) => {
        //console.log(counters.from, counters.from.toLocaleString('es-US', { timeZone: 'America/Guatemala' }), counters.in, counters.store);
         if(tiendasPasadas.includes(counters.store) ==  false){
            tiendasEntradas[counters.store] =  {store:'', in:0, out:0, date:''};
            tiendasPasadas.push(counters.store);
        }
        tiendasEntradas[counters.store].store = counters.store;
        tiendasEntradas[counters.store].date = todayGuatemalaDate;
        tiendasEntradas[counters.store].in = tiendasEntradas[counters.store].in + counters.in;  
        tiendasEntradas[counters.store].out = tiendasEntradas[counters.store].out + counters.out;
    });
    //console.log(tiendasEntradas);
    tiendasPasadas.map(async(tiendas, position) =>{
        const showCounter = {
            date:tiendasEntradas[tiendas].date,
            in: tiendasEntradas[tiendas].in,
            out: tiendasEntradas[tiendas].out,
            store: tiendasEntradas[tiendas].store
        };
        const insertData = CounterUnion(showCounter);
        await insertData.save();
        console.log("Entra", showCounter);
    });
    
    return res.status(200).json({"Message":"Datos Ingresados"});
});

router.get("/dataCounterStore/:dateInit/:store", async(req, res) => {
    const { dateInit, store } = req.params;
    if(moment(dateInit, 'YYYY-MM-DD',true).isValid()){
        console.log(`${dateInit}T18:20:59.000+00:00`);
    let showDataCounter = await CounterUnion.find({ 
            date: new Date(`${dateInit}T18:20:59.000+00:00`),
            store: store
        },{in: 1, out: 1, store: 1 })
    const counterPush = [];

    showDataCounter.map(counters => {

        const showCounter = {
            fecha: "",
            entrada: "",
            salida: 0
        };

        showCounter.entrada = counters.in;
        showCounter.salida = counters.out;
        showCounter.fecha = counters.date;

        counterPush.push(showCounter);
    });

    console.log(counterPush.length);
    return res.status(200).json(counterPush);

   
    }else{
        return res.status(400).json({ message: "Error, fechas en formato incorrecto" });
    }
});

module.exports = router;