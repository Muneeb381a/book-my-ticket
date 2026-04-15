import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class CreateTheaterDto extends BaseDto {
  static schema = Joi.object({
    name:    Joi.string().trim().min(2).max(100).required(),
    city:    Joi.string().trim().min(2).max(100).required(),
    address: Joi.string().trim().min(5).max(300).required(),
  });
}

export default CreateTheaterDto;
