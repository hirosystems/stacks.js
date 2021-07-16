npm run build

if [ $? -eq 0 ]
then
  echo "Successfully built"
else
  echo "Build failure"
	exit 1
fi

node dist/index.js -I http://localhost:20443 call_read_only_contract_func SP000000000000000000002Q6VF78 pox get-pox-info SPEET2XN4XHZNX8R374HKCNMEJDMEA0B8KBXRF7Q
