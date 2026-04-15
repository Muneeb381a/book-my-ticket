import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

const seatEntrySchema = Joi.object({
  row:      Joi.string().trim().uppercase().max(2).required(),
  col:      Joi.number().integer().min(1).required(),
  type:     Joi.string().valid("regular", "premium", "vip").default("regular"),
  isActive: Joi.boolean().default(true),
});

class CreateScreenDto extends BaseDto {
  static schema = Joi.object({
    name:    Joi.string().trim().min(1).max(100).required(),
    seatMap: Joi.array().items(seatEntrySchema).min(1).required(),
  });
}

export default CreateScreenDto;
