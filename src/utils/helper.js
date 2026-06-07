import Camp from "../models/camp.model.js";
import SOS from "../models/sos.model.js";

export const getDistanceInKm = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const R = 6371; // Earth radius in KM

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );

  return R * c;
};



export const calculateNearbySOSCount = async (agentId) => {

    const camps = await Camp.find({
        createdBy: agentId
    });

    if (!camps.length) {
        return 0;
    }

    const sosList = await SOS.find({
        status: "missed" // optional if you have status field
    });

    const uniqueSOS = new Set();

    for (const camp of camps) {

        for (const sos of sosList) {

            const distance = getDistanceInKm(
                camp.latitude,
                camp.longitude,
                sos.latitude,
                sos.longitude
            );

            if (distance <= 5) {
                uniqueSOS.add(sos._id.toString());
            }
        }
    }

    return uniqueSOS.size;
};

export const getAffectedCamps = async (latitude, longitude) => {

    const camps = await Camp.find();

    const affectedCamps = [];

    for (const camp of camps) {

        const distance = getDistanceInKm(
            latitude,
            longitude,
            camp.latitude,
            camp.longitude
        );

        if (distance <= 5) {
            affectedCamps.push(camp);
        }
    }

    return affectedCamps;
};