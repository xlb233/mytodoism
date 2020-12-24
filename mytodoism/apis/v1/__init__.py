from flask import Blueprint
from flask_cors import CORS

api_v1 = Blueprint('api_v1', __name__)
# 为api_v1蓝本下的所有路由添加跨域访问支持
CORS(api_v1)

from mytodoism.apis.v1 import resources
