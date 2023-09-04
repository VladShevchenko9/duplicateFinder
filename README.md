# Duplicate Finder
Script for finding duplicate files by content.

# Examples of usage 
- Searching groups of duplicates in a folder. Let`s say we have the following list of files on a disk:
    - `temp/A/C/1C.txt`  
    - `temp/A/1A.txt`
    - `temp/B/1B.txt`
    - `temp/B/2B.txt`
    
    Where `1C.txt` and `1B.txt` have the following content:
    ```
    123
    345
    5667
    123
    ```   
    Same as `1A.txt` and `2B.txt`: 
    ```
    123
    345
    asdax
    ```
    And we want to determine which of them are duplicates. Then we run this command:
    `npm run start`
    
    Then we see the following menu: 
    ```
    What would you like to do?
    1) Search Duplicates in some dir.
    2) Search Duplicate of specific File.
    ```
    Select the first option and type a path where to start searching for duplicates:
    ```
    In which directory would you like to search? (Full path)
    ./temp
    Searching in ...\temp
    Searching in ...\temp\A
    Duplicates group # 1
    ...\temp\B\2B.txt
    ...\temp\A\1A.txt
    
    Duplicates group # 2
    ...\temp\B\1B.txt
    ...\temp\A\C\1C.txt
    ```
- Searching for duplicates of some specific file. Let`s say we know that we probably have a duplicate of some file in some directory.
  Then we can check it this way:
  ```
  What would you like to do?
  1) Search Duplicates in some dir.
  2) Search Duplicate of specific File.
  2
  In which directory would you like to search? (Full path)
  ./someDir
  Please, type a path for a base file.
  ./someOtherDir/someFile.txt
  
  The list of duplicates
  
  1) ...\someDir\someOtherFile.txt
  Type a file number to remove or -1 to EXIT
  -1
  ```