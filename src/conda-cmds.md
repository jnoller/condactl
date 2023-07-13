conda is a tool for managing and deploying applications, environments and packages.

Options:

positional arguments:
  command
    clean             Remove unused packages and caches.
    compare           Compare packages between conda environments.
    config            Modify configuration values in .condarc. This is modeled after the git config command. Writes to the user .condarc file
                      (/Users/jesse/.condarc) by default. Use the --show-sources flag to display all identified configuration locations on your
                      computer.
    create            Create a new conda environment from a list of specified packages.
    info              Display information about current conda install.
    init              Initialize conda for shell interaction.
    install           Installs a list of packages into a specified conda environment.
    list              List installed packages in a conda environment.
    package           Low-level conda package utility. (EXPERIMENTAL)
    remove (uninstall)
                      Remove a list of packages from a specified conda environment. Use `--all` flag to remove all packages and the environment
                      itself.
    rename            Renames an existing environment.
    run               Run an executable in a conda environment.
    search            Search for packages and display associated information.The input is a MatchSpec, a query language for conda packages. See
                      examples below.
    update (upgrade)  Updates conda packages to the latest compatible version.

clean
compare - env
create
info
init
list
remove
rename
run - run an executable
search

- Add user input sanitization
s

Environment operations
clean
compare (env1, env2)
config
list
rename
update?
