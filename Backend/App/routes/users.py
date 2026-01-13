from fastapi import APIRouter
from App.crud import users
from App.schemas import UserSchema,LoginSchema


user_router=APIRouter(prefix="/users", tags=(["users"]))

@user_router.get("/")
def get_all_users():
    return users.get_all_users()

@user_router.get("/{user_id}")
def get_user_by_id(user_id:int):
    return users.get_user_by_id(user_id)

@user_router.post("/create")
def create_user(data:UserSchema):
    return users.create_user(data)

@user_router.put("/update/{user_id}")
def update_user(user_id:int,data:UserSchema):
    return users.update_user(user_id,data)

@user_router.delete("/delete/{user_id}")
def delete_user(user_id:int):
    return users.delete_user(user_id)

@user_router.post("/login")
def user_login(data:LoginSchema):
    return users.login(data)