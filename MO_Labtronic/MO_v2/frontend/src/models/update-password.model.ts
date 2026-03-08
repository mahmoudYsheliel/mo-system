export interface UpdatePasswordModel {
  oldPassword: string;
  password: string;
  passwordConfirm: string;
}

interface FieldError{
    code?:string,
    message?:string
}

export interface UpdatePasswordErrorModel {
  oldPassword?:FieldError ;
  password?: FieldError;
  passwordConfirm?: FieldError;
}
