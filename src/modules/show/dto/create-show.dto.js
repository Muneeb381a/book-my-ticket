import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class CreateShowDto extends BaseDto {
  static schema = Joi.object({
    movieId:   Joi.string().hex().length(24).required(),
    screenId:  Joi.string().hex().length(24).required(),
    startTime: Joi.date().iso().greater("now").required(),
    pricing: Joi.object({
      regular: Joi.number().min(0).required(),
      premium: Joi.number().min(0).required(),
      vip:     Joi.number().min(0).required(),
    }).required(),
  });
}

export default CreateShowDto;
