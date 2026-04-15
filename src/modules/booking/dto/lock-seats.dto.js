import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class LockSeatsDto extends BaseDto {
  static schema = Joi.object({
    showId:  Joi.string().hex().length(24).required(),
    seatIds: Joi.array()
      .items(Joi.string().hex().length(24))
      .min(1)
      .max(10) // reasonable cap — prevents locking an entire show
      .required(),
  });
}

export default LockSeatsDto;
