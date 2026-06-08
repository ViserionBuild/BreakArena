requirement

pip install openpyxl psycopg2-binary

DATABASE_URL="postgresql://postgres:pass@host:5432/dbname" python migrate.py

//For Local
"postgresql://postgres:postgres@127.0.0.1:54329/postgres" python migrate.py

python3 migrate.py 