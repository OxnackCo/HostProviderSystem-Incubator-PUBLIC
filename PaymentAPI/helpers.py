import requests
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor
import json
from fastapi import FastAPI, HTTPException, Request, Depends, Response, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Tuple
import time
from datetime import datetime
import asyncio
import threading
from contextlib import asynccontextmanager
import json
from pydantic import BaseModel