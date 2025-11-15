#!/bin/bash

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

LOGS_DIR="logs/dev"

# Check if logs directory exists
if [ ! -d "$LOGS_DIR" ]; then
    echo -e "${RED}No logs directory found at $LOGS_DIR${NC}"
    echo "Run 'npm run dev:log' first to generate logs"
    exit 1
fi

# Function to display menu
show_menu() {
    echo -e "\n${CYAN}==================================${NC}"
    echo -e "${CYAN}Development Logs Viewer${NC}"
    echo -e "${CYAN}==================================${NC}\n"
    echo "1) View latest full log"
    echo "2) View latest errors only"
    echo "3) List all log files"
    echo "4) View specific log file"
    echo "5) Search logs for pattern"
    echo "6) View logs in real-time (tail)"
    echo "7) Clear old logs"
    echo "8) Exit"
    echo -n -e "\n${YELLOW}Select an option:${NC} "
}

# Function to view latest log
view_latest() {
    LATEST_LOG=$(ls -t "$LOGS_DIR"/dev_*.log 2>/dev/null | head -1)
    if [ -z "$LATEST_LOG" ]; then
        echo -e "${RED}No log files found${NC}"
        return
    fi
    echo -e "${GREEN}Viewing: $LATEST_LOG${NC}"
    less -R "$LATEST_LOG"
}

# Function to view latest errors
view_errors() {
    LATEST_ERROR=$(ls -t "$LOGS_DIR"/dev_errors_*.log 2>/dev/null | head -1)
    if [ -z "$LATEST_ERROR" ]; then
        echo -e "${YELLOW}No error log files found${NC}"
        return
    fi
    echo -e "${GREEN}Viewing errors: $LATEST_ERROR${NC}"
    less -R "$LATEST_ERROR"
}

# Function to list all logs
list_logs() {
    echo -e "\n${CYAN}Available log files:${NC}\n"
    ls -lht "$LOGS_DIR"/*.log 2>/dev/null | awk '{print NR")", $9, "("$5")"}'
    echo ""
}

# Function to view specific log
view_specific() {
    list_logs
    echo -n -e "${YELLOW}Enter log number to view:${NC} "
    read -r log_num
    LOG_FILE=$(ls -t "$LOGS_DIR"/*.log 2>/dev/null | sed -n "${log_num}p")
    if [ -z "$LOG_FILE" ]; then
        echo -e "${RED}Invalid log number${NC}"
        return
    fi
    echo -e "${GREEN}Viewing: $LOG_FILE${NC}"
    less -R "$LOG_FILE"
}

# Function to search logs
search_logs() {
    echo -n -e "${YELLOW}Enter search pattern:${NC} "
    read -r pattern
    echo -e "\n${GREEN}Searching for '$pattern' in all logs...${NC}\n"
    grep -r --color=always "$pattern" "$LOGS_DIR"/*.log 2>/dev/null | less -R
}

# Function to tail logs
tail_logs() {
    LATEST_LOG=$(ls -t "$LOGS_DIR"/dev_*.log 2>/dev/null | head -1)
    if [ -z "$LATEST_LOG" ]; then
        echo -e "${RED}No log files found${NC}"
        return
    fi
    echo -e "${GREEN}Tailing: $LATEST_LOG${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"
    tail -f "$LATEST_LOG"
}

# Function to clear old logs
clear_logs() {
    echo -e "${YELLOW}This will delete all logs except the latest 5.${NC}"
    echo -n "Are you sure? (y/N): "
    read -r confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        LOG_COUNT=$(ls -1 "$LOGS_DIR"/*.log 2>/dev/null | wc -l)
        if [ "$LOG_COUNT" -gt 5 ]; then
            ls -t "$LOGS_DIR"/*.log | tail -n +6 | xargs rm -f
            echo -e "${GREEN}Old logs cleared. Kept latest 5 files.${NC}"
        else
            echo -e "${YELLOW}Only $LOG_COUNT log files found. Nothing to clear.${NC}"
        fi
    else
        echo -e "${YELLOW}Operation cancelled${NC}"
    fi
}

# Main loop
while true; do
    show_menu
    read -r choice

    case $choice in
        1) view_latest ;;
        2) view_errors ;;
        3) list_logs ;;
        4) view_specific ;;
        5) search_logs ;;
        6) tail_logs ;;
        7) clear_logs ;;
        8) echo -e "${GREEN}Goodbye!${NC}"; exit 0 ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
done
