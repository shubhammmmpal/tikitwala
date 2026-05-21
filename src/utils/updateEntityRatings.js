import Review from "../models/review.model.js";
import Hotel from "../models/hotel.model.js";
import Bus from "../models/Bus.model.js";
import BusTrip from "../models/BusTrip.model.js";

// Add more models later
const ENTITY_MODELS = {
  Hotel,
  Bus,
  BusTrip,
};

export const updateEntityRatings = async (
  entityType,
  entityId
) => {
  try {

    // =========================================
    // GET MODEL
    // =========================================

    const Model = ENTITY_MODELS[entityType];

    if (!Model) return;

    // =========================================
    // GET ALL APPROVED REVIEWS
    // =========================================

    const reviews = await Review.find({
      entityId,
      entityType,
      isApproved: true,
    });

    // =========================================
    // TOTAL REVIEWS
    // =========================================

    const totalReviews = reviews.length;

    // =========================================
    // DEFAULT DISTRIBUTION
    // =========================================

    const distribution = {
      1: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      5: { count: 0, percentage: 0 },
    };

    // =========================================
    // CALCULATE AVERAGE
    // =========================================

    let totalRating = 0;

    reviews.forEach((review) => {

      totalRating += review.rating;

      distribution[review.rating].count += 1;

    });

    // =========================================
    // PERCENTAGE
    // =========================================

    Object.keys(distribution).forEach((key) => {

      distribution[key].percentage =
        totalReviews > 0
          ? Number(
              (
                (distribution[key].count /
                  totalReviews) *
                100
              ).toFixed(2)
            )
          : 0;

    });

    // =========================================
    // AVERAGE
    // =========================================

    const average =
      totalReviews > 0
        ? Number(
            (totalRating / totalReviews).toFixed(1)
          )
        : 0;

    // =========================================
    // UPDATE ENTITY
    // =========================================

    await Model.findByIdAndUpdate(entityId, {
      ratings: {
        average,
        totalReviews,
        distribution,
      },
    });

  } catch (error) {

    console.log(error);

  }
};

