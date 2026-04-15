import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class ResetPasswordDto extends BaseDto {
  static schema = Joi.object({
    password: Joi.string()
      .min(8)
      .required()
      .messages({ "string.min": "Password must be at least 8 characters" }),
  });
}

export default ResetPasswordDto;
