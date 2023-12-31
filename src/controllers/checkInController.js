const { PrismaClient } = require("@prisma/client");
const arrageData = require("../utils/arrageData");
const {
  passengersWithMinors,
  passengersWithNoMinors,
} = require("../utils/getGroupsWithMinors");
const changeSeatsOrder = require("../utils/changeSeatsOrder");
const assignSeats = require("../utils/assignSeats");
const prisma = new PrismaClient();

const checkInController = async (req, res) => {
  const { id } = req.params;
  const flightId = parseInt(id);

  try {
    if (flightId !== 1 && flightId !== 2 && flightId !== 3 && flightId !== 4) {
      return res.status(404).json({
        code: 404,
        data: {},
      });
    }
    // TODO Obtener los datos del vuelo por el ID de la URL
    const flight = await prisma.flight.findUnique({
      where: { flight_id: flightId}
    })

    // TODO Obtener los asientos del avion de dicho vuelo
    const seats = await prisma.seat.findMany({
        where: {airplane_id: flight.airplane_id }
    })

     

    // TODO Obtener los pasajes de abordaje y pasajeros  de dicho vuelo
    const boarding_passesWithPassengerData = await prisma.boarding_pass.findMany({
      where:{flight_id : flightId}, include:{ passenger:true}
    })



    // TODO arrageData
      let passengerWithPases= arrageData(boarding_passesWithPassengerData) 


    //? //////////////////////////////////////////////////////////////////////////////
    // TODO Buscar los grupos con y SIN menores.
  const passengerWithMinors =  passengersWithMinors(passengerWithPases) 
  const passengerWithNoMinors =  passengersWithNoMinors(passengerWithPases) 

    // TODO Ordenar los asientos y asignarlos.
  
   const seatsInRows = await changeSeatsOrder(seats); 
  const passengersWithSeatsAsigned = await assignSeats(seatsInRows,passengerWithMinors,passengerWithNoMinors);   
  /*  return res.json(seatsInRows);  */
  return res.status(200).json({
      code: 200,
      data: {
        flightId: flight.flight_id,
        takeoffDateTime: flight.takeoff_date_time,
        takeoffAirport: flight.takeoff_airport,
        landingDateTime: flight.landing_date_time,
        landingAirport: flight.landing_airport,
        airplaneId: flight.airplane_id,
        passengers: passengersWithSeatsAsigned,
      },
    });
  } catch (error) {
    console.error(error);
    if (error.message === "flight not found") {
      return res.status(404).json({
        code: 404,
        data: {},
      });
    }
    return res.status(400).json({
      code: 400,
      errors: "could not connect to db",
    });
  }
};

module.exports = checkInController;
