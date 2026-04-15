import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class ConfirmBookingDto extends BaseDto {
  static schema = Joi.object({
    showId:    Joi.string().hex().length(24).required(),
    seatIds:   Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
    paymentId: Joi.string().trim(), // optional — stub for real gateway reference
  });
}

export default ConfirmBookingDto;
