#!/bin/bash

# Get environment variables
source .env

# Apply the migration
supabase db reset
