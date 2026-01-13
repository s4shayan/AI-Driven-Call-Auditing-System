from fastapi import HTTPException
from App.db import engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql import text
from App.schemas import UserSchema,LoginSchema

def get_all_users():
    try:
        with engine.connect() as conn:
            result=conn.execute(text("""Select * from Users""")).mappings()
            return [dict(row) for row in result]
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
def get_user_by_id(user_id:int):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("""Select * from Users where user_id=:user_id"""),
                                {"user_id":user_id}
                                ).mappings()
            row=result.fetchone()
            if(row):
                return dict(row)
            raise HTTPException(status_code=404,detail= f"user with id={user_id} not found")
    except SQLAlchemyError as e:
            raise HTTPException(status_code=500,detail=str(e))

def create_user(data:UserSchema):
    try:
        with engine.connect() as conn:
            conn.execute(text("""Insert into Users (username,email,password) values(:username,:email,:password)"""),
                         {
                             "username":data.username,
                             "email":data.email,
                             "password":data.password,
                         })
            conn.commit()
            return{
                "status":"success",
                "message":"User uploaded successfully"
            }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500,detail=str(e))
    
def update_user(user_id:int,data:UserSchema):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("""Update Users set username=:username, email=:email, password=:password where user_id=:user_id"""),
                                {
                                    "username":data.username,
                                    "email":data.email,
                                    "password":data.password,
                                    "user_id":user_id
                                })
            if result.rowcount==0:
                raise HTTPException(status_code=404, detail=f"user with id={user_id} does not exists")
            conn.commit()
            return{
                "status":"success",
                "message":f"User with id={user_id} updated successfully"
            }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

def delete_user(user_id:int):
    try:
        with engine.connect() as conn:
            result=conn.execute(text("""Delete from Users where user_id=:user_id"""),
                                {"user_id":user_id})
            if result.rowcount==0:
                raise HTTPException(status_code=404, detail=f"user with id={user_id} does not exists")
            conn.commit()
            return{
                "status":"success",
                "message":f"User with id={user_id} Deleted successfully"
            }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
def login(data:LoginSchema):
    try:
        with engine.connect() as conn:
            result = conn.execute(  
                text("""
                    SELECT * FROM Users 
                    WHERE (username=:ue OR email=:ue) AND password=:pw
                """),
                {"ue": data.username_or_email, "pw": data.password}
            ).mappings()

            user = result.fetchone()
            if user:
                return {
                    "success": True,
                    "user": dict(user)
                }
            else:
                return {
                    "success": False,
                    "message": "Invalid username/email or password"
                }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

    
