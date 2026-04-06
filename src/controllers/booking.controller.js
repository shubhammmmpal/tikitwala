import Booking from "../models/Booking.model.js";
import BusTrip from "../models/BusTrip.model.js";

// ====================== BOOK BUS TRIP ======================
export const bookBusTrip = async (req, res) => {
  try {
    const {
      busTripId,
      passengers,           // Array of passengers
      contactEmail,
      contactPhone,
      selectedSeats         // Array of seat numbers like ["12 Upper", "13 Upper"]
    } = req.body;

    const userId = req.user?.id; // Assuming you have JWT authentication middleware

    // if (!userId) {
    //   return res.status(401).json({ success: false, message: "Please login to book" });
    // }

    // Fetch BusTrip
    const busTrip = await BusTrip.findById(busTripId);
    if (!busTrip) {
      return res.status(404).json({ success: false, message: "Bus trip not found" });
    }

    if (busTrip.status !== "active") {
      return res.status(400).json({ success: false, message: "This trip is not available for booking" });
    }

    // Validate selected seats
    if (!selectedSeats || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: "Please select at least one seat" });
    }

    if (selectedSeats.length !== passengers.length) {
      return res.status(400).json({ success: false, message: "Number of seats and passengers must match" });
    }

    // Check seat availability and mark as booked
    let totalAmount = 0;
    const bookedSeats = [];

    for (let i = 0; i < selectedSeats.length; i++) {
      const seatNo = selectedSeats[i];
      const seat = busTrip.seats.find(s => s.seatNo === seatNo);

      if (!seat) {
        return res.status(400).json({ success: false, message: `Seat ${seatNo} not found` });
      }
      if (seat.status !== "available") {
        return res.status(400).json({ success: false, message: `Seat ${seatNo} is already booked` });
      }

      // Mark seat as booked
      seat.status = "booked";
      seat.bookedBy = userId;
      seat.genderBooked = passengers[i].gender;

      totalAmount += seat.seatPrice;
      bookedSeats.push(seat);
    }

    // Calculate GST and Platform Fee (You can adjust logic)
    const gst = Math.round(totalAmount * 0.05);           // 5% GST
    const platformFee = 100;
    const finalAmount = totalAmount + gst + platformFee;

    // Create Booking
    const newBooking = new Booking({
      bookingId: "", // Will be auto-generated in pre-save
      user: userId,
      busTrip: busTripId,
      bus: {
        busNo: busTrip.bus.busNo || "N/A", // If populated
        busType: busTrip.bus.busType,
      },
      startPoint: busTrip.startPoint,
      endPoint: busTrip.endPoint,
      departureDateTime: busTrip.departureDateTime,
      arrivalDateTime: busTrip.arrivalDateTime,
      departureDate: busTrip.departureDate,
      departureTime: busTrip.departureTime,
      arrivalDate: busTrip.arrivalDate,
      arrivalTime: busTrip.arrivalTime,
      travelDuration: busTrip.travelDuration,

      passengers: passengers.map((p, index) => ({
        name: p.name,
        gender: p.gender,
        age: p.age,
        seatNo: selectedSeats[index],
        deck: bookedSeats[index].deck,
      })),

      totalPassengers: passengers.length,
      contactEmail,
      contactPhone,
      totalSeatsBooked: passengers.length,

      fareBreakup: {
        baseFare: totalAmount,
        gst,
        platformFee,
        otherCharges: 0,
        totalAmount: finalAmount
      },

      paymentStatus: "pending",   // Change to "paid" after successful payment
      status: "confirmed"
    });

    await newBooking.save();
    await busTrip.save(); // Save updated seat status

    res.status(201).json({
      success: true,
      message: "Booking successful!",
      data: newBooking
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Booking failed"
    });
  }
};