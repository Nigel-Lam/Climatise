cd frontend
npm run dev &
FRONTEND_PID=$!

cd ../backend
echo "Starting backend..."
export PYTHONPATH=$(pwd)
uvx --with pandas fastapi[standard] dev server.py &
BACKEND_PID=$!

cleanup() {
  echo "Stopping processes..."
  kill $FRONTEND_PID $BACKEND_PID
  exit
}

trap cleanup SIGINT

wait $FRONTEND_PID $BACKEND_PID
