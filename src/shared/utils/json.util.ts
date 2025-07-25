import { HttpStatus, Injectable } from '@nestjs/common';
import { ValidationError } from 'class-validator';

@Injectable()
export class JsonUtil {
  private static readonly StatusResponse = {
    Success: 1,
    Error: 0,
  };

  static success<T>(data: T, message: string = 'Success', dataCount?: number) {
    const response: any = {
      isSuccess: JsonUtil.StatusResponse.Success,
      message,
      data,
    };

    if (dataCount !== undefined) {
      response.dataCount = dataCount;
    }

    return {
      statusCode: HttpStatus.OK,
      body: response,
    };
  }

  private static error(
    status?: number,
    code?: string,
    message?: string,
    data?: any,
  ) {
    return {
      statusCode: status ?? HttpStatus.BAD_REQUEST,
      body: {
        isSuccess: JsonUtil.StatusResponse.Error,
        code,
        message,
        data,
      },
    };
  }

  static errors(status: number, code: string, errors: ValidationError[]) {
    const validation = JsonUtil.flattenValidationErrors(errors);

    return {
      statusCode: status,
      body: {
        isSuccess: JsonUtil.StatusResponse.Error,
        code,
        validation,
      },
    };
  }

  static errorSimple(
    status: number = HttpStatus.BAD_REQUEST,
    code?: string,
    message: string = 'Error',
    errors?: any,
  ) {
    return JsonUtil.error(status, code, message, errors);
  }

  private static flattenValidationErrors(errors: ValidationError[]): Array<{
    target: string;
    message: string;
  }> {
    const result: { target: string; message: string }[] = [];

    const recurse = (errs: ValidationError[]) => {
      for (const err of errs) {
        if (err.constraints) {
          for (const msg of Object.values(err.constraints)) {
            result.push({
              target: err.property,
              message: msg,
            });
          }
        }

        if (err.children && err.children.length > 0) {
          recurse(err.children);
        }
      }
    };

    recurse(errors);
    return result;
  }
}
