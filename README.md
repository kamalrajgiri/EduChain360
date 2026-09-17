# Student : 
mysql -u root -p < src/config/schema_student.sql

# In Server/
mysql -u root -p < src/config/schema_student.sql    
# once
npm run seed                                          
# creates 8 logins (if not run)
npm run seed:student                                  
# creates Rajan's data
npm run dev