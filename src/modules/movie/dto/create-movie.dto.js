import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class CreateMovieDto extends BaseDto {
  static schema = Joi.object({
    title:       Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().max(2000),
    durationMins: Joi.number().integer().min(1).required(),
    genre:       Joi.array().items(Joi.string().trim()).min(1).required(),
    language:    Joi.string().trim().required(),
    releaseDate: Joi.date().iso(),
    posterUrl:   Joi.string().uri().trim(),
  });
}

export default CreateMovieDto;
